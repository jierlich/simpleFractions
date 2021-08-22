const deploy = require('./deploy')

deploy()
    .then(() => process.exit(0))
    .catch(error => {
        console.log(error)
        process.exit(1)
    })
