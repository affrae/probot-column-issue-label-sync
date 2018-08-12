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

## Configuration from file

In your repository, create a file .github/probotcolumnissuelabelsync.yml

```yml

# What is the name of the project board you wish to use?

projectBoard: Alerts Project From Config File

# What are the labels and corresponding columns you wish to track?
# Format:
# labelName: columnName

labelsColumns: 
   🛑 Red: Red
   Yellow: ⚠️ Yellow
   Green: Green

# What are the default labels you wish to add to a new issue?

defaultLabels:
   - Green

# Where do you want the card to move to in the new column?
# Can be one of top, bottom, or after:<card_id>, 
# where <card_id> is the id value of a card in the same column
# Allowed values: top, bottom, after:

defaultColumnPosition: bottom

```

