//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './PriceConverter.sol';

error FundMe__NotOwner();
error FundMe__LessFund();
error FundMe__CallFailed();

/**
 * @title A contract for crowd funding
 * @author Murat Can Bastug
 * @notice This contract is to demo a sample funding contract
 * @dev This implements price feeds as our library
 */

contract FundMe {
  using PriceConverter for uint256;

  address private immutable i_owner;
  uint256 public constant MINIMUM_USD = 50;
  address[] private s_funders;
  mapping(address => uint256) private s_addressToAmountFunded;
  AggregatorV3Interface private s_priceFeed;

  modifier onlyOwner() {
    if (msg.sender != i_owner) revert FundMe__NotOwner();
    _;
  }

  constructor(address priceFeedAddress) {
    i_owner = msg.sender;
    s_priceFeed = AggregatorV3Interface(priceFeedAddress);
  }

  receive() external payable {
    fund();
  }

  fallback() external payable {
    fund();
  }

  function fund() public payable {
    if (msg.value.getConversionRate(s_priceFeed) < MINIMUM_USD)
      revert FundMe__LessFund();

    s_funders.push(msg.sender);
    s_addressToAmountFunded[msg.sender] = msg.value;
  }

  function withdraw() public onlyOwner {
    address[] memory funders = s_funders;
    for (uint256 i = 0; i < funders.length; i = i + 1) {
      s_addressToAmountFunded[funders[i]] = 0;
    }
    s_funders = new address[](0);

    (bool successCall, ) = payable(msg.sender).call{
      value: address(this).balance
    }('');
    if (!successCall) revert FundMe__CallFailed();
  }

  function getOwner() public view returns (address) {
    return i_owner;
  }

  function getfunder(uint256 index) public view returns (address) {
    return s_funders[index];
  }

  function getAddressToAmountFunded(address funder)
    public
    view
    returns (uint256)
  {
    return s_addressToAmountFunded[funder];
  }

  function getPriceFeed() public view returns (AggregatorV3Interface) {
    return s_priceFeed;
  }
}
