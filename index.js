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
  rygProjectDefaultColumnPosition:"bottom"

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
    robot.log("WebHook received - Issue Opened: " + payload.issue.title)

/*
* _.intersection returns an array that represents the items that are in both
* the newIssuesLabels and rygProjectLabels arrays. An enpty set indicates
* nothing in common, so we should add the default project labels
*/

    if(_.intersection(newIssuesLabels, rygProjectLabels).length==0) {
      robot.log("Adding Default Labels: " + rygProjectDefaultLabels)
      await github.issues.addLabels(context.issue({ labels:  rygProjectDefaultLabels  }));
    }

    return
  })

  robot.on('issues.labeled', async context => {
    const { payload, github } = context;
    const addedLabelName = payload.label.name
    robot.log("WebHook received - Issue labelled: " + addedLabelName)

    if (addedLabelName in rygProjectDefaultConfig.rygProjectLabelsColumns) {
      const targetProjectName = rygProjectDefaultConfig.rygProjectProjectBoard;
      const targetColumnName = rygProjectDefaultConfig.rygProjectLabelsColumns[addedLabelName];
      const rygProjectLabels = Object.keys(rygProjectDefaultConfig.rygProjectLabelsColumns)
      const issuesLabelsList = payload.issue.labels
      const issuesLabels = issuesLabelsList.map(issue => issue["name"]);
      const arrayToClean = _.intersection(issuesLabels, rygProjectLabels)
      const projectColumnPosition = rygProjectDefaultConfig.rygProjectDefaultColumnPosition
      robot.log("Target Column is: " + targetColumnName)

      /*
      * Get the configured rygProjectProjectBoard project
      * Note: This method will resolve on the first open project
      * with the required name
      */
      var theProject = null
      const theProjectParams = context.repo({state:"open"})

      await github.paginate(
        github.projects.getRepoProjects(theProjectParams),
        (res, done) => {
          for (let project of res.data) {
            robot.log("We found a project with name: " + project.name)
            if (project.name === targetProjectName) {
              theProject = project;
              done();
              break;
            }
          }
        })
        if (theProject !== null ) {
          robot.log("We found the project with name: " + targetProjectName)
          const theProjectID = theProject.id;
          const theProjectColumnParams = {project_id : theProjectID};

          var allColumns = [];
          var targetColumn = null;
          var targetCard = null;
          await github.paginate(
            github.projects.getProjectColumns(theProjectColumnParams),
            (res, done) => {
              for (let column of res.data) {
                robot.log("We found a column with name: " + column.name);
                allColumns = allColumns.concat(column.id);
                if (column.name === targetColumnName) {
                  targetColumn = column;
                }
              }
            })
            robot.log(allColumns);

            for (let columnID of allColumns) {
              robot.log("Getting cards for: " + columnID)
              var repoColumnCardsParams = context.repo({column_id: columnID});
              await context.github.paginate(
                context.github.projects.getProjectCards(repoColumnCardsParams),
                (res, done) => {
                  for (let card of res.data) {
                    if (typeof card.content_url != 'undefined') {
                      robot.log("Checking a card with card.content_url: " + card.content_url)
                      if (card.content_url.endsWith('issues/'+payload.issue.number)) {
                        robot.log("Found THE card with card.content_url: " + card.content_url)
                        targetCard = card;
                        done()
                      }
                      if (targetCard !== null) {
                        break
                      }
                    }
                  }
                })
                if (targetCard !== null) {
                  break
                }
              }

            if (targetColumn !== null ) {
              robot.log("We found the column with name: " + targetColumnName);


              if ( targetCard !== null ) {
                robot.log("Target card found")
                if(targetCard.column_url != targetColumn.url) {
                  robot.log("Target card not already in the column")
                  var repoMoveCardsParams = context.repo({position: rygProjectDefaultConfig.rygProjectDefaultColumnPosition, id:targetCard.id , column_id:targetColumn.id});
                  var myResult = await github.projects.moveProjectCard(repoMoveCardsParams);
                } else {
                  robot.log("Target card already in the column")
                }
              } else {
                robot.log("Target card not found")
                robot.log("Creating Issue Card in column: " + targetColumnName);
                const repoColumnParams = context.repo({column_id:targetColumn.id, content_id:payload.issue.id, content_type:"Issue"});
                await github.projects.createProjectCard(repoColumnParams)              }
            } else {
              robot.log("Column not found : " + targetColumnName)
            }
          } else {
         robot.log("Project not found : " + targetProjectName)
       }

      for (const key of arrayToClean) {
        if(key !== addedLabelName) {
          robot.log("Removing label: " + key);
          const params = context.issue({name: key})
          await github.issues.removeLabel(params)
        }
      }
    }
  })

  robot.on('issues.unlabeled', async context => {
    const { payload, github } = context;
    const labelName = payload.label.name
    robot.log("WebHook received - Issue Label removed: " + labelName)
    const rygProjectLabels = Object.keys(rygProjectDefaultConfig.rygProjectLabelsColumns)
    const issuesLabelsList =  payload.issue.labels
    const issuesLabels = issuesLabelsList.map(issuesLabelsList => issuesLabelsList["name"]);
    const arrayToClean = _.intersection(issuesLabels, rygProjectLabels)
    if (arrayToClean.length == 0) {
      robot.log("No required labels left, re-adding label: " + labelName)
      await github.issues.addLabels(context.issue({ labels: [labelName] }));

    }
  })

  robot.on('project_card.moved', async context => {
    const { payload, github } = context;
    project_card = payload.project_card
    const column_id = project_card.column_id;
    const content_url = project_card.content_url;

    robot.log("WebHook received - Card moved to column with id: " + column_id + " and content_url: " + content_url)

    if (typeof content_url == 'undefined') {
      robot.log("Card is a note - no further action to be taken.")
    } else {
      issueNumber = content_url.split("/").slice(-1).pop();
      robot.log("Card represents issue #" + issueNumber + " - relabelling...")
      projectColumn = await github.projects.getProjectColumn(context.repo({column_id: column_id}));
      projectColumnName = projectColumn.data.name;
      robot.log("Project Column Name is: " + projectColumnName)

      // Get the label name that matches the column Name
      theNewLabel = (_.invert(rygProjectDefaultConfig.rygProjectLabelsColumns))[projectColumnName]
      robot.log("Label for Column: " + projectColumnName + " is " + theNewLabel)
      if(typeof theNewLabel != 'undefined') {
        await github.issues.addLabels(context.issue({ number: issueNumber, labels: [theNewLabel] }));

      } else {
        robot.log("Column is not in watched list")
      }
      // Label the project
    }


  })

  }
