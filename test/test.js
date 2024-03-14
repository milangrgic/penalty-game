const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers, upgrades } = require('hardhat');

describe("Test", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  async function deployContracts() {
    const [owner, account1, account2] = await ethers.getSigners();
  
    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy("Community Token", "COM");

    const Pool = await ethers.getContractFactory("PoolContract");
    const pool = await Pool.deploy(token.target);

    const Community = await ethers.getContractFactory("CommunityContract");
    const community = await Community.deploy(token.target, pool.target);

    await pool.setCommunity(community.target);
    await token.setCommunity(community.target);

    return { token, pool, community, owner, account1, account2 };
  }

  describe("Deployment Test", async function () {
    it("Community token name should be same as we set after deploy token contract.", async function () {
      const { token } = await loadFixture(deployContracts);
      expect(await token.name()).to.equal("Community Token");
    });
  });

  describe("Member Management Test", async function () {
    it("Only 2 members should be in the members list after deploy community contract.", async function () {
      const { community, owner, pool } = await loadFixture(deployContracts);
      const members = await community.getMembers();
      expect(members.length).to.equal(2);
      expect(members[0]).to.equal(owner.address);
      expect(members[1]).to.equal(pool.target);
    });

    it("Add member should be failed if it already exists.", async function () {
      const { community, owner, account1 } = await loadFixture(deployContracts);
      await community.addMember(account1.address);
      await expect(community.addMember(account1.address)).to.be.revertedWith("Member already exists");
    });

    it("Add member function should be called by admin, if else should failed.", async function () {
      const { community, owner, account1 } = await loadFixture(deployContracts);
      await expect(community.connect(account1).addMember(account1.address)).to.be.revertedWith("Only admin can perform this action");
    });

    it("New member should be in the members list if Add member function call success.", async function () {
      const { community, owner, account1 } = await loadFixture(deployContracts);
      await community.addMember(account1.address);

      const members = await community.getMembers();
      expect(members.length).to.equal(3);
      expect(members[2]).to.equal(account1.address);
      expect(await community.isMember(account1.address)).to.equal(true);
    });
    
    it("Remove non-existing member should be failed.", async function () {
      const { community, account1 } = await loadFixture(deployContracts);
      await expect(community.removeMember(account1.address)).to.be.revertedWith("Member does not exist");
    });
    
    it("Remove admin or pool address from members list should be failed.", async function () {
      const { community, owner, pool } = await loadFixture(deployContracts);
      await expect(community.removeMember(owner.address)).to.be.revertedWith("Can't remove admin or pool");
      await expect(community.removeMember(pool.target)).to.be.revertedWith("Can't remove admin or pool");
    });
    
    it("Removed member should not be in the list after Remove Member function call success.", async function () {
      const { community, owner, account1, account2 } = await loadFixture(deployContracts);
      await community.addMember(account1.address);
      await community.addMember(account2.address);
      await community.removeMember(account1.address);

      expect(await community.isMember(account1.address)).to.equal(false);
      expect(await community.isMember(account2.address)).to.equal(true);
    });
  });

  describe("Success Test For Requesting Flow", async function () {
    it("Requested transfer parameters in the transferRequests list list should be correct after Request transfer function call success", async function () {
      const { community, owner, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);

      await community.connect(account1).requestTransfer(owner.address, ethers.parseEther('1'));
      const transferRequests = await community.getTransferRequests();
      expect(transferRequests.length).to.equal(1);
      expect(transferRequests[0][0]).to.equal(account1.address);
      expect(transferRequests[0][1]).to.equal(owner.address);
      expect(transferRequests[0][2]).to.equal(ethers.parseEther('1'));
      expect(transferRequests[0][3]).to.equal(false);
      expect(transferRequests[0][4]).to.equal(false);
    });
    
    it("Requested transfer token should be deposited to the escrow contract and also approved parameter should be true after approve transfer success.", async function () {
      const { community, owner, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);

      await community.connect(account1).requestTransfer(owner.address, ethers.parseEther('1'));

      await token.depositForRequest(account1.address, ethers.parseEther('1'), 0);
      await community.approveTransfer(0);

      const transferRequests = await community.getTransferRequests();
      expect(transferRequests.length).to.equal(1);
      expect(transferRequests[0][3]).to.equal(true); // approved parameter for transfer request
    });
    
    it("Requested token should be sent to requester and also completed parameter should be true after approve and complete request", async function () {
      const { community, owner, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);

      await community.connect(account1).requestTransfer(owner.address, ethers.parseEther('1'));

      await token.depositForRequest(community.target, ethers.parseEther('1'), 0);
      await community.approveTransfer(0);

      await community.connect(account1).completeTransfer(0);

      expect(await token.balanceOf(account1.address)).to.equal(ethers.parseEther('1'));

      const transferRequests = await community.getTransferRequests();
      expect(transferRequests.length).to.equal(1);
      expect(transferRequests[0][4]).to.equal(true); // completed parameter for transfer request
    });
    
    it("Requested token should be sent to requester from pool after approve and complete transfer by admin from pool.", async function () {
      const { community, owner, account1, account2, token, pool } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);

      await token.transfer(pool.target, ethers.parseEther('100'));
      await community.connect(account1).requestTransfer(pool.target, ethers.parseEther('1'));

      await community.approveTransfer(0);

      await community.connect(account1).completeTransfer(0);

      expect(await token.balanceOf(account1.address)).to.equal(ethers.parseEther('1'));

      const transferRequests = await community.getTransferRequests();
      expect(transferRequests.length).to.equal(1);
      expect(transferRequests[0][4]).to.equal(true); // completed parameter for transfer request
    });
  });
  
  describe("Failing Test For Requesting Flow", async function () {
    it("Should be failed for the request from non-existing member", async function () {
      const { community, pool, account1, account2 } = await loadFixture(deployContracts);

      await community.addMember(account1.address);

      await expect(community.connect(account2).requestTransfer(pool.target, ethers.parseEther('1')))
        .to.be.revertedWith("Sender is not a member");
    });
    
    it("Should be failed for the request to non-existing member", async function () {
      const { community, pool, account1, account2 } = await loadFixture(deployContracts);

      await community.addMember(account1.address);

      await expect(community.connect(account1).requestTransfer(account2.address, ethers.parseEther('1')))
        .to.be.revertedWith("Recipient is not a member");
    });
    
    it("Should be failed for the request to an account that has insufficient balance.", async function () {
      const { community, pool, account1, account2 } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);

      await expect(community.connect(account2).requestTransfer(account1.address, ethers.parseEther('1')))
        .to.be.revertedWith("Insufficient balance");
    });
    
    it("Should be failed approve for the already approved request.", async function () {
      const { community, pool, account1, token } = await loadFixture(deployContracts);

      await token.transfer(pool.target, ethers.parseEther('100'));
      await community.addMember(account1.address);

      await expect(community.connect(account1).requestTransfer(pool.target, ethers.parseEther('1')));
      await community.approveTransfer(0);

      await expect(community.approveTransfer(0)).to.be.revertedWith("Transfer request already approved");
    });
    
    it("Should be failed approve for the request that requested to pool from non-admin.", async function () {
      const { community, pool, account1, token } = await loadFixture(deployContracts);

      await token.transfer(pool.target, ethers.parseEther('100'));
      await community.addMember(account1.address);

      await community.connect(account1).requestTransfer(pool.target, ethers.parseEther('1'));
      await expect(community.connect(account1).approveTransfer(0)).to.be.revertedWith("Only admin can approve transfer");
    });

    it("Should be failed approve by non-requested member.", async function () {
      const { community, pool, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);
      await token.transfer(account1.address, ethers.parseEther('100'));

      await community.connect(account2).requestTransfer(account1.address, ethers.parseEther('1'));
      await expect(community.connect(account2).approveTransfer(0)).to.be.revertedWith("Only requested member can approve transfer");
    });
    
    it("Should be failed approve if requested receiver did not deposit token to escrow contract before approve.", async function () {
      const { community, pool, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);
      await token.transfer(account1.address, ethers.parseEther('10'));

      await community.connect(account2).requestTransfer(account1.address, ethers.parseEther('8'));
      await expect(community.connect(account1).approveTransfer(0)).to.be.revertedWith("Request receiver didn't deposit token to Community");
    });
    
    it("Should be failed approve if requested receiver did not deposit enough token to escrow contract for the request before approve.", async function () {
      const { community, pool, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);
      await token.transfer(account1.address, ethers.parseEther('10'));

      await community.connect(account2).requestTransfer(account1.address, ethers.parseEther('8'));
      await expect(token.connect(account1).depositForRequest(community.target, ethers.parseEther('1'), 0)).to.be.revertedWith('Please deposit enough token amount');
    });

    it("Should be failed complete for the non-approved request.", async function () {
      const { community, pool, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);
      await token.transfer(account1.address, ethers.parseEther('100'));

      await community.connect(account2).requestTransfer(account1.address, ethers.parseEther('1'));
      await expect(community.connect(account2).completeTransfer(0)).to.be.revertedWith("Transfer request not approved");
    });

    it("Should be failed complete for the already completed request.", async function () {
      const { community, pool, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);
      await token.transfer(account1.address, ethers.parseEther('100'));

      await community.connect(account2).requestTransfer(account1.address, ethers.parseEther('1'));
      await token.connect(account1).depositForRequest(community.target, ethers.parseEther('1'), 0);
      await community.connect(account1).approveTransfer(0);
      await community.connect(account2).completeTransfer(0);
      await expect(community.connect(account2).completeTransfer(0)).to.be.revertedWith("Transfer request already completed");
    });
    
    it("Should be failed complete if non-requester tried to complete request.", async function () {
      const { community, pool, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);
      await token.transfer(account1.address, ethers.parseEther('100'));

      await community.connect(account2).requestTransfer(account1.address, ethers.parseEther('1'));
      await token.connect(account1).depositForRequest(community.target, ethers.parseEther('1'), 0);
      await community.connect(account1).approveTransfer(0);
      await expect(community.connect(account1).completeTransfer(0)).to.be.revertedWith("Only requesting member can complete transfer");
    });
    
    it("Should be failed approve or complete for the function call with invalid request id.", async function () {
      const { community, pool, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);
      await token.transfer(account1.address, ethers.parseEther('100'));

      await community.connect(account2).requestTransfer(account1.address, ethers.parseEther('1'));
      await token.connect(account1).depositForRequest(community.target, ethers.parseEther('1'), 0);
      await expect(community.connect(account1).approveTransfer(1)).to.be.revertedWith("Invalid Request Id");
      await expect(community.connect(account1).completeTransfer(1)).to.be.revertedWith("Invalid Request Id");
    });
  });
});
