const rygProjectDefaultConfig = {
  rygProjectProjectBoard:"🛑⚠️❇️ Alerts",
  rygProjectLabelsColumns: {
    "🛑 Red":"🛑 Red",
    "⚠️ Yellow":"⚠️ Yellow",
    "❇️ Green":"❇️ Green"
  }
}

module.exports = robot => {
  robot.log('Yay, the app was loaded!');
  robot.log('rygProjectDefaultConfig entries');
  for (const [key,value] of Object.entries(rygProjectDefaultConfig)) {
    robot.log(key, value);
  }
  robot.on('issues.labeled', async context => {
    const labelName = context.payload.label.name
    if (labelName in rygProjectDefaultConfig.rygProjectLabelsColumns) {
      robot.log(labelName + ' is in rygProjectLabelsColumns');
      for (const [key,value] of Object.entries(rygProjectDefaultConfig.rygProjectLabelsColumns)) {
        if(key===labelName) {
          robot.log('Match for ' + key + '. Moving Project Card to column ' + value)
        }
        else {
          const labels = context.payload.issue.labels;
          robot.log(labels);
          robot.log('Deleting ' + key + ' Label');
          const params = context.issue({name: key});
//          return context.github.issues.removeLabel(params)
          return
        }
      }
    }
    else {
      robot.log(labelName + ' is NOT in rygProjectLabelsColumns');
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
