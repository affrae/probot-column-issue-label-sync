const rygProjectDefaultConfig = {
  rygProjectProjectBoard:"🛑⚠️❇️ Alerts",
  rygProjectLabelsColumns: {
    "🛑 Red":"🛑 Red",
    "⚠️ Yellow":"⚠️ Yellow",
    "❇️ Green":"❇️ Green"
  },
  rygProjectDefaultLabels:["❇️ Green"],

  /*
  Can be one of top, bottom, or after:<card_id>, where <card_id> is the id value of a card in the same column, or in the new column specified by column_id.

  Allowed values: top, bottom, after:
*/
  rygProjectDefaultColumnPosition:"top"

}


var _ = require('underscore');

/*
* Sample functi0on declaration
function myFunction(p1, p2) {
    return p1 * p2;              // The function returns the product of p1 and p2
}
*
*/

module.exports = robot => {

/*
* If an issue is opened, check what labels it has. If it soes not have a label
* from the project board label list, add the Default Project Label
*/

  robot.on('issues.opened', async context => {
    const { payload, github } = context;
    const rygProjectLabels = Object.keys(rygProjectDefaultConfig.rygProjectLabelsColumns);
    const newIssuesLabelsList =  payload.issue.labels;
    const newIssuesLabels= newIssuesLabelsList.map(newIssuesLabelsList => newIssuesLabelsList["name"]);
    const rygProjectDefaultLabels = rygProjectDefaultConfig.rygProjectDefaultLabels;

/*
* _.intersection returns an array that represents the items that are in both
* the newIssuesLabels and rygProjectLabels arrays. An enpty set indicates
* nothing in common, so we should add the default project labels
*/

    if(_.intersection(newIssuesLabels, rygProjectLabels).length==0) {
      await github.issues.addLabels(context.issue({ labels:  rygProjectDefaultLabels  }));
    }

    return
  })

  robot.on('issues.labeled', async context => {
    const { payload, github } = context;
    const targetColumnlabelName = payload.label.name

  if (targetColumnlabelName in rygProjectDefaultConfig.rygProjectLabelsColumns) {
      const targetColumnName = rygProjectDefaultConfig.rygProjectLabelsColumns[targetColumnlabelName];
      const rygProjectLabels = Object.keys(rygProjectDefaultConfig.rygProjectLabelsColumns)
      const issuesLabelsList = payload.issue.labels
      const issuesLabels = issuesLabelsList.map(issuesLabelsList => issuesLabelsList["name"]);
      const arrayToClean = _.intersection(issuesLabels, rygProjectLabels)
      const rygProjectColumnPosition = rygProjectDefaultConfig.rygProjectDefaultColumnPosition

      for (const key of arrayToClean) {
        if(key === targetColumnName) {
/*
* 1. Get the configured rygProjectProjectBoard project
*/
          const theProjectParams = context.repo({state:"open", name:rygProjectDefaultConfig.rygProjectProjectBoard})
          const theProjects = await github.projects.getRepoProjects(theProjectParams);
          const theProjectsData = theProjects.data;

          if (theProjectsData.length == 1) { // we found the project

            const theProjectID = theProjectsData[0].id;
            const theProjectColumnParams = {project_id : theProjectID};

            const theProjectColumns = await github.projects.getProjectColumns(theProjectColumnParams);
            const theProjectColumnsData = theProjectColumns.data;

            const targetColumn = theProjectColumnsData.filter(column => column.name === targetColumnName);

            if (targetColumn.length == 1) { // we found the column
              columnID = targetColumn[0].id;

              var allCards = [];
              for (const column in theProjectColumnsData) {
                var repoColumnCardsParams = context.repo({column_id:theProjectColumnsData[column].id});
                var repoColumnCards = await github.projects.getProjectCards(repoColumnCardsParams);
                const repoColumnCardsData = repoColumnCards.data
                allCards = allCards.concat(repoColumnCardsData);
              }

// Filter out our card (where is the issue's id) and get the card ID
             const targetCard = allCards.filter(card => card.content_url.endsWith('issues/'+payload.issue.number));
             if( targetCard.length == 1){
               var repoMoveCardsParams = context.repo({position: rygProjectDefaultConfig.rygProjectDefaultColumnPosition, id:targetCard[0].id , column_id:columnID});

               var myResult = await github.projects.moveProjectCard(repoMoveCardsParams);

             } else if ( targetCard.length == 0 ) {
               const repoColumnParams = context.repo({column_id:columnID, content_id:payload.issue.id, content_type:"Issue"});
               await github.projects.createProjectCard(repoColumnParams)
             }            }

          }

/*
2. Find the new column via the [key,value] pair from rygProjectLabelsColumns
3. Find the issue's card in the project, if it does not exist, create it (singleton pattern)
4. Move the card to the new column
*/
        }
        else {
          const params = context.issue({name: key})
          context.github.issues.removeLabel(params)
        }
      }
    }
    return
  })
/*
  robot.on('issues.opened', async context => {
    // `context` extracts information from the event, which can be passed to
    // GitHub API calls. This will return:
    //   {owner: 'yourname', repo: 'yourrepo', number: 123, body: 'Hello World!}
    const params = context.issue({body: 'Hello World!'})

    // Post a comment on the issue
    return context.github.issues.createComment(params)
  })
  */

  robot.on('issues.unlabeled', async context => {
    const { payload, github } = context;
    const labelName = payload.label.name
    const rygProjectLabels = Object.keys(rygProjectDefaultConfig.rygProjectLabelsColumns)
    const issuesLabelsList =  payload.issue.labels
    const issuesLabels = issuesLabelsList.map(issuesLabelsList => issuesLabelsList["name"]);
    const arrayToClean = _.intersection(issuesLabels, rygProjectLabels)
    if (arrayToClean.length == 0) {
      await github.issues.addLabels(context.issue({ labels: [labelName] }));

    }
  })

robot.on('issues.closed', async context => {
    // `context` extracts information from the event, which can be passed to
    // GitHub API calls. This will return:
    //   {owner: 'yourname', repo: 'yourrepo', number: 123, body: 'Hello World!}
    const params = context.issue({body: 'Goodbye!'})

    // Post a comment on the issue
    return context.github.issues.createComment(params)
  })
}
