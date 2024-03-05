import React, { memo } from "react";
// import PropTypes from "prop-types";

import { Routes , Route } from "react-router-dom";

// Pages
import Dashboard from "../pages/Dashboard";
import Members from "../pages/Members";
import Requests from "../pages/Requests";
import MyRequests from "../pages/MyRequests";
import ApproveRequests from "../pages/ApproveRequests";

const Routing = () => {

    return (
        <Routes>
            <Route path="/" element={<Members />} />
            <Route path="/members" element={<Members />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/approve-requests" element={<ApproveRequests />} />
        </Routes>
    );
}

export default memo(Routing);
