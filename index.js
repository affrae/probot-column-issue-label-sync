const rygProjectDefaultConfig = {
  rygProjectProjectBoard:"🛑⚠️❇️ Alerts",
  rygProjectLabelsColumns: {
    "🛑 Red":"🛑 Red",
    "⚠️ Yellow":"⚠️ Yellow",
    "❇️ Green":"❇️ Green"
  }
}

module.exports = robot => {

  robot.on('issues.labeled', async context => {
    const labelName = context.payload.label.name
    if (labelName in rygProjectDefaultConfig.rygProjectLabelsColumns) {
      robot.log(labelName + ' is in rygProjectLabelsColumns');
      for (const [key,value] of Object.entries(rygProjectDefaultConfig.rygProjectLabelsColumns)) {
        if(key===labelName) {
          robot.log('Match for ' + key + '. Moving Project Card to column ' + value)
/*
1. Get the configured rygProjectProjectBoard project
*/
          const repoProjectParams = context.repo({state:"open"})
          robot.log(repoProjectParams)
          theProjects = await context.github.projects.getRepoProjects(repoProjectParams);
          theData = theProjects.data;
          for each (const theProject of theData){
            robot.log(theProject.name);
          }


/*
2. Find the new column via the [key,value] pair from rygProjectLabelsColumns
3. Find the issue's card in the project, if it does not exist, create it (singleton pattern)
4. Move the card to the new column
*/
        }
        else {
          robot.log('Deleting ' + key + ' Label');
          const params = context.issue({name: key})
          context.github.issues.removeLabel(params)
        }
      }
    }
    return
  })
  robot.on('issues.opened', async context => {
    // `context` extracts information from the event, which can be passed to
    // GitHub API calls. This will return:
    //   {owner: 'yourname', repo: 'yourrepo', number: 123, body: 'Hello World!}
    const params = context.issue({body: 'Hello World!'})

    // Post a comment on the issue
    return context.github.issues.createComment(params)
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
