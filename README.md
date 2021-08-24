# Simple Fractions
A minimal contract for fractionalizing ERC721s into an ERC20.

## Overview
Users can deposit ERC721s into a vault contract and receive freshly minted
ERC20 tokens. The vault can be configured for any number of IDs of an ERC721 with
different mint values set for each ID. Users can withdraw any ERC721 token ID from a
vault if they burn the amount of the ERC20 that was minted for that ERC721 upon
deposit.
