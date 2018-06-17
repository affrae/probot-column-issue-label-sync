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

      for (const key of arrayToClean) {
        if(key === addedLabelName) {
          var theProject = {}
          const theProjectParams = context.repo({state:"open"})
          await github.paginate(
            github.projects.getRepoProjects(theProjectParams),
            (res, done) => {
              for (let project of res.data) {
                robot.log("We found a project with name: " + project.name)
                if (project.name === targetProjectName) {
                  robot.log("We found the project with name: " + targetProjectName)
                  theProject = project;
                  done();
                  break;
                }
              }
            })

          if (theProject != {} ) {
            const theProjectID = theProject.id;
            const theProjectColumnParams = {project_id : theProjectID};

            var targetColumn = {};

            await context.github.paginate(
              github.projects.getProjectColumns(theProjectColumnParams),
              (res, done) => {
                for (let column of res.data) {
                  robot.log("We found a column with name: " + column.name);
                  if (column.name === targetColumnName) {
                    robot.log("We found the column with name: " + targetColumnName);
                    targetColumn = column;
                    done();
                    break;
                  }
                }
              })

            } else {
           robot.log("Project not found : " + targetProjectName)
         }
       } else {
          robot.log("Removing label: " + key);
          const params = context.issue({name: key})
          context.github.issues.removeLabel(params)
        }
      }
    }
    return
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

robot.on('issues.closed', async context => {
    // `context` extracts information from the event, which can be passed to
    // GitHub API calls. This will return:
    //   {owner: 'yourname', repo: 'yourrepo', number: 123, body: 'Hello World!}
    const params = context.issue({body: 'Goodbye!'})

    // Post a comment on the issue
    return context.github.issues.createComment(params)
  })
}
