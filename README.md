# Probot Column Issue Label Sync

A GitHub App built with [probot](https://github.com/probot/probot) that will:

1. Update an issue card's column in a defined project when a label from a defined list of label:column keypairs is added to the issue
2. Update an issue's label when its project card is moved to one of the columns defined in the same list of column:label keypairs
3. Ensure that label is unique from that same defined list.

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```
