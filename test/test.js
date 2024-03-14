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

  describe("Deployment", async function () {
    it("should be the correct token name", async function () {
      const { token } = await loadFixture(deployContracts);
      expect(await token.name()).to.equal("Community Token");
    });
  });

  describe("Member Management", async function () {
    it("should be 2 member after deploy contract", async function () {
      const { community, owner, pool } = await loadFixture(deployContracts);
      const members = await community.getMembers();
      expect(members.length).to.equal(2);
      expect(members[0]).to.equal(owner.address);
      expect(members[1]).to.equal(pool.target);
    });

    it("should be failed when add exist member", async function () {
      const { community, owner, account1 } = await loadFixture(deployContracts);
      await community.addMember(account1.address);
      await expect(community.addMember(account1.address)).to.be.revertedWith("Member already exists");
    });

    it("should be failed when call add member function without admin", async function () {
      const { community, owner, account1 } = await loadFixture(deployContracts);
      await expect(community.connect(account1).addMember(account1.address)).to.be.revertedWith("Only admin can perform this action");
    });

    it("should be success add member function", async function () {
      const { community, owner, account1 } = await loadFixture(deployContracts);
      await community.addMember(account1.address);

      const members = await community.getMembers();
      expect(members.length).to.equal(3);
      expect(members[2]).to.equal(account1.address);
      expect(await community.isMember(account1.address)).to.equal(true);
    });
    
    it("should be failed when remove doesn't exist member", async function () {
      const { community, account1 } = await loadFixture(deployContracts);
      await expect(community.removeMember(account1.address)).to.be.revertedWith("Member does not exist");
    });
    
    it("should be failed when try to remove admin or pool", async function () {
      const { community, owner, pool } = await loadFixture(deployContracts);
      await expect(community.removeMember(owner.address)).to.be.revertedWith("Can't remove admin or pool");
      await expect(community.removeMember(pool.target)).to.be.revertedWith("Can't remove admin or pool");
    });
    
    it("should be success remove member function", async function () {
      const { community, owner, account1, account2 } = await loadFixture(deployContracts);
      await community.addMember(account1.address);
      await community.addMember(account2.address);
      await community.removeMember(account1.address);

      expect(await community.isMember(account1.address)).to.equal(false);
      expect(await community.isMember(account2.address)).to.equal(true);
    });
  });

  describe("Success Test For Requesting Flow", async function () {
    it("should be success request transfer token", async function () {
      const { community, owner, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);

      await community.connect(account1).requestTransfer(owner.address, ethers.parseEther('1'));
      // console.log(await token.balanceOf(owner.address), ethers.parseEther('1'));
      // expect(token.balanceOf(owner.address)).to.equal();
      const transferRequests = await community.getTransferRequests();
      expect(transferRequests.length).to.equal(1);
      expect(transferRequests[0][0]).to.equal(account1.address);
      expect(transferRequests[0][1]).to.equal(owner.address);
      expect(transferRequests[0][2]).to.equal(ethers.parseEther('1'));
      expect(transferRequests[0][3]).to.equal(false);
      expect(transferRequests[0][4]).to.equal(false);
    });
    
    it("should be success approve the request transfer token", async function () {
      const { community, owner, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);

      await community.connect(account1).requestTransfer(owner.address, ethers.parseEther('1'));

      await token.depositForRequest(account1.address, ethers.parseEther('1'), 0);
      await community.approveTransfer(0);

      const transferRequests = await community.getTransferRequests();
      expect(transferRequests.length).to.equal(1);
      expect(transferRequests[0][3]).to.equal(true);
    });
    
    it("should be success complete the requested transfer token", async function () {
      const { community, owner, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);

      await community.connect(account1).requestTransfer(owner.address, ethers.parseEther('1'));
      // console.log(await token.balanceOf(owner.address), ethers.parseEther('1'));
      // expect(token.balanceOf(owner.address)).to.equal();

      await token.depositForRequest(community.target, ethers.parseEther('1'), 0);
      await community.approveTransfer(0);
      // expect(await token.allowance(owner.address, community.target)).to.equal(ethers.parseEther('1'));

      await community.connect(account1).completeTransfer(0);

      expect(await token.balanceOf(account1.address)).to.equal(ethers.parseEther('1'));

      const transferRequests = await community.getTransferRequests();
      expect(transferRequests.length).to.equal(1);
      expect(transferRequests[0][4]).to.equal(true);
    });
    
    it("should be success to check request to pool", async function () {
      const { community, owner, account1, account2, token, pool } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);

      await token.transfer(pool.target, ethers.parseEther('100'));
      await community.connect(account1).requestTransfer(pool.target, ethers.parseEther('1'));

      await community.approveTransfer(0);
      // expect(await token.allowance(pool.target, community.target)).to.equal(ethers.parseEther('1'));

      await community.connect(account1).completeTransfer(0);

      expect(await token.balanceOf(account1.address)).to.equal(ethers.parseEther('1'));

      const transferRequests = await community.getTransferRequests();
      expect(transferRequests.length).to.equal(1);
      expect(transferRequests[0][4]).to.equal(true);
    });
  });
  
  describe("Failing Test For Requesting Flow", async function () {
    it("should be failed request without member", async function () {
      const { community, pool, account1, account2 } = await loadFixture(deployContracts);

      await community.addMember(account1.address);

      await expect(community.connect(account2).requestTransfer(pool.target, ethers.parseEther('1')))
        .to.be.revertedWith("Sender is not a member");
    });
    
    it("should be failed request to non-member", async function () {
      const { community, pool, account1, account2 } = await loadFixture(deployContracts);

      await community.addMember(account1.address);

      await expect(community.connect(account1).requestTransfer(account2.address, ethers.parseEther('1')))
        .to.be.revertedWith("Recipient is not a member");
    });
    
    it("should be failed request to an account that has insufficient balance", async function () {
      const { community, pool, account1, account2 } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);

      await expect(community.connect(account2).requestTransfer(account1.address, ethers.parseEther('1')))
        .to.be.revertedWith("Insufficient balance");
    });
    
    it("should be failed approve already approved request", async function () {
      const { community, pool, account1, token } = await loadFixture(deployContracts);

      await token.transfer(pool.target, ethers.parseEther('100'));
      await community.addMember(account1.address);

      await expect(community.connect(account1).requestTransfer(pool.target, ethers.parseEther('1')));
      await community.approveTransfer(0);

      await expect(community.approveTransfer(0)).to.be.revertedWith("Transfer request already approved");
    });
    
    it("should be failed approve a request that requested to pool without admin", async function () {
      const { community, pool, account1, token } = await loadFixture(deployContracts);

      await token.transfer(pool.target, ethers.parseEther('100'));
      await community.addMember(account1.address);

      await community.connect(account1).requestTransfer(pool.target, ethers.parseEther('1'));
      await expect(community.connect(account1).approveTransfer(0)).to.be.revertedWith("Only admin can approve transfer");
    });

    it("should be failed approve without requested member", async function () {
      const { community, pool, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);
      await token.transfer(account1.address, ethers.parseEther('100'));

      await community.connect(account2).requestTransfer(account1.address, ethers.parseEther('1'));
      await expect(community.connect(account2).approveTransfer(0)).to.be.revertedWith("Only requested member can approve transfer");
    });
    
    it("should be failed if request receiver not deposit token to community before approve", async function () {
      const { community, pool, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);
      await token.transfer(account1.address, ethers.parseEther('10'));

      await community.connect(account2).requestTransfer(account1.address, ethers.parseEther('8'));
      await expect(community.connect(account1).approveTransfer(0)).to.be.revertedWith("Request receiver didn't deposit token to Community");
    });
    
    it("should be failed if request receiver not deposit enough token to community for the request", async function () {
      const { community, pool, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);
      await token.transfer(account1.address, ethers.parseEther('10'));

      await community.connect(account2).requestTransfer(account1.address, ethers.parseEther('8'));
      await expect(token.connect(account1).depositForRequest(community.target, ethers.parseEther('1'), 0)).to.be.revertedWith('Please deposit enough token amount');
    });

    it("should be failed complete non-approved transfer", async function () {
      const { community, pool, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);
      await token.transfer(account1.address, ethers.parseEther('100'));

      await community.connect(account2).requestTransfer(account1.address, ethers.parseEther('1'));
      await expect(community.connect(account2).completeTransfer(0)).to.be.revertedWith("Transfer request not approved");
    });

    it("should be failed complete already completed request", async function () {
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
    
    it("should be failed complete already completed request", async function () {
      const { community, pool, account1, account2, token } = await loadFixture(deployContracts);

      await community.addMember(account1.address);
      await community.addMember(account2.address);
      await token.transfer(account1.address, ethers.parseEther('100'));

      await community.connect(account2).requestTransfer(account1.address, ethers.parseEther('1'));
      await token.connect(account1).depositForRequest(community.target, ethers.parseEther('1'), 0);
      await community.connect(account1).approveTransfer(0);
      await expect(community.connect(account1).completeTransfer(0)).to.be.revertedWith("Only requesting member can complete transfer");
    });
    
    it("should be failed approve or complete with invalid request id", async function () {
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
