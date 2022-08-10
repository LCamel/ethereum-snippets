// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

contract A {
    uint64 x = 3;
    uint128 y = 4;
    uint64 z = 5;
    function foo(uint64 x1, uint128 y1, uint64 z1) public {
        x = x1;
        y = y1;
        z = z1;
        //address addr = 0x7f268357A8c2552623316e2562D90e642bB538E5;
        //addr.call("");
    }
}
