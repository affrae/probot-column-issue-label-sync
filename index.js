const rygProjectDefaultConfig = {
  rygProjectProjectBoard:"🛑⚠️❇️ Alerts",
  rygProjectLabelsColumns: {
    "🛑 Red":"🛑 Red",
    "⚠️ Yellow":"⚠️ Yellow",
    "❇️ Green":"❇️ Green"
  },
  rygProjectDefaultLabel:"❇️ Green",

}


var _ = require('underscore');

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
    const rygProjectDefaultLabel = rygProjectDefaultConfig.rygProjectDefaultLabel;

/* _.intersection returns an array that represents the items that are in both
* the newIssuesLabels and rygProjectLabels arrays. An enpty set indicates
* nothing in common, so we should add teh default project labels
*/

    if(_.intersection(newIssuesLabels, rygProjectLabels).length==0) {
      await github.issues.addLabels(context.issue({ labels: [ rygProjectDefaultLabel ] }));
    }

    return
  })

  robot.on('issues.labeled', async context => {
    const { payload, github } = context;
    const labelName = payload.label.name
    const rygProjectLabels = Object.keys(rygProjectDefaultConfig.rygProjectLabelsColumns)
    const issuesLabelsList =  payload.issue.labels
    const issuesLabels = issuesLabelsList.map(issuesLabelsList => issuesLabelsList["name"]);
    const arrayToClean = _.intersection(issuesLabels, rygProjectLabels)

    if (labelName in rygProjectDefaultConfig.rygProjectLabelsColumns) {
      for (const key of arrayToClean) {
        if(key===labelName) {
/*
1. Get the configured rygProjectProjectBoard project
*/
          const repoProjectParams = context.repo({state:"open", name:rygProjectDefaultConfig.rygProjectProjectBoard})
          const theProjects = await github.projects.getRepoProjects(repoProjectParams);
          const theData = theProjects.data;

          robot.log('Moving Project Card to column \'' + rygProjectDefaultConfig.rygProjectLabelsColumns[key] + '\' in Project \'' + rygProjectDefaultConfig.rygProjectProjectBoard + '\'')
          var projectID = -1;
          if (theData.length == 1)
          {
            projectID = theData[0].id;
            let allProjects = []
            const projectColumnParams = {project_id : projectID};

            const theProjectColumns = await github.projects.getProjectColumns(projectColumnParams);
            const theProjectColumnsData = theProjectColumns.data;

            robot.log(theProjectColumnsData);
/*
            for (const projectColumn of theProjectColumns) {
              robot.log('Project Column: \'' + projectColumn.name +'\'' )
            }
*/
            robot.log('Finished moving Project Card to column \'' + rygProjectDefaultConfig.rygProjectLabelsColumns[key] + '\'')
          }
          else
          {
            robot.log('Project \'' + rygProjectDefaultConfig.rygProjectProjectBoard + '\' not found');
          }


/*
2. Find the new column via the [key,value] pair from rygProjectLabelsColumns
3. Find the issue's card in the project, if it does not exist, create it (singleton pattern)
4. Move the card to the new column
*/
        }
        else {
          robot.log('Deleting \'' + key + '\' from the Modified Issue\'s Labels');
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
    robot.log('Newly removed label is: \'' + labelName + '\'');
    const issuesLabelsList =  payload.issue.labels
    const issuesLabels = issuesLabelsList.map(issuesLabelsList => issuesLabelsList["name"]);
    robot.log('Modified Issue\'s Label Array is:');
    robot.log(issuesLabels);
    const arrayToClean = _.intersection(issuesLabels, rygProjectLabels)
    robot.log('Modified Issue\'s Project Label Array is:');
    robot.log(arrayToClean);
    if (arrayToClean.length == 0) {
      robot.log('Oops we removed all Project Labels, re-adding \'' + labelName + '\' label')
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
