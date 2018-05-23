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

  robot.on('issues.opened', async context => {
    const { payload, github } = context;
    var theCommentBody = 'Hello World! I just noticed that issue #' + payload.issue.number + ' was opened.'
    const rygProjectLabels = Object.keys(rygProjectDefaultConfig.rygProjectLabelsColumns)
    robot.log('Issue #' + payload.issue.number + ' opened.');
    robot.log('Label Array is:');
    robot.log(rygProjectLabels);
    var newIssuesLabelsList =  payload.issue.labels
    var newIssuesLabels= newIssuesLabelsList.map(newIssuesLabelsList => newIssuesLabelsList["name"]);
    robot.log('New Issue\'s Label Array is:');
    robot.log(newIssuesLabels);
    robot.log(_.intersection(newIssuesLabels, rygProjectLabels));
    if(_.intersection(newIssuesLabels, rygProjectLabels).length==0) {
      robot.log('Need to add ' + rygProjectDefaultConfig.rygProjectDefaultLabel + ' label');
      theCommentBody += ' I have also added the '+ rygProjectDefaultConfig.rygProjectDefaultLabel + ' label';
      const labelParams = context.issue({name: rygProjectDefaultConfig.rygProjectDefaultLabel});
      await github.issues.addLabels(context.issue({ labels: [rygProjectDefaultConfig.rygProjectDefaultLabel] }));

    }
    const params = context.issue({body: theCommentBody})
    return context.github.issues.createComment(params)
  })

  robot.on('issues.labeled', async context => {
    const { payload, github } = context;
    const labelName = payload.label.name
    const rygProjectLabels = Object.keys(rygProjectDefaultConfig.rygProjectLabelsColumns)
    robot.log('Newly added label is: \'' + labelName + '\'');
    robot.log('Default Project Label Array is:');
    robot.log(rygProjectLabels);
    const issuesLabelsList =  payload.issue.labels
    const issuesLabels = issuesLabelsList.map(issuesLabelsList => issuesLabelsList["name"]);
    robot.log('Modified Issue\'s Label Array is:');
    robot.log(issuesLabels);
    const arrayToClean = _.intersection(issuesLabels, rygProjectLabels)
    robot.log('Modified Issue\'s Project Label Array is:');
    robot.log(arrayToClean);

    if (labelName in rygProjectDefaultConfig.rygProjectLabelsColumns) {
      robot.log('\'' + labelName + '\' is in Default Project Label Array');
      for (const key of arrayToClean) {
        if(key===labelName) {
/*
1. Get the configured rygProjectProjectBoard project
*/
          const repoProjectParams = context.repo({state:"open", name:rygProjectDefaultConfig.rygProjectProjectBoard})
          theProjects = await github.projects.getRepoProjects(repoProjectParams);
          theData = theProjects.data;

          robot.log('Moving Project Card to column \'' + rygProjectDefaultConfig.rygProjectLabelsColumns[key] + '\' in Project \'' + rygProjectDefaultConfig.rygProjectProjectBoard + '\'')
          var projectID = -1;
          if (theData.length == 1)
          {
            projectID = theData[0].id;
            projectName = theData[0].name;
            robot.log('Project \'' + projectName + '\' found!');
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

  robot.on('issues.closed', async context => {
    // `context` extracts information from the event, which can be passed to
    // GitHub API calls. This will return:
    //   {owner: 'yourname', repo: 'yourrepo', number: 123, body: 'Hello World!}
    const params = context.issue({body: 'Goodbye!'})

    // Post a comment on the issue
    return context.github.issues.createComment(params)
  })
}
