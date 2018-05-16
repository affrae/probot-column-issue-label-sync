const rygProjectDefaultConfig = {
  rygProjectBoard:"🛑⚠️❇️ Alerts"
}

module.exports = robot => {
  robot.log('Yay, the app was loaded!')
  robot.log('rygProjectDefaultConfig entries')
  for (const entry of rygProjectDefaultConfig.entries()) {
    robot.log(entry);
  }
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
