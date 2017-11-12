import groovy.json.*
  
node {
  stage('🚧 Checkout') {
    println("☘️" + env.BRANCH_NAME)
    checkout scm
  }
  stage('📦 Build') {
    println("🚧 building project")
    def nodeHome = tool name: 'nodejs', type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'
    env.PATH = "${nodeHome}/bin:${env.PATH}"
    sh "npm install"
    sh "npm test"  
  }
  stage('🚢 Check if Deploy') {
    println("☘️" + env.BRANCH_NAME)
    if(env.BRANCH_NAME.equals("master")) {
      stage('Deploy to production 🚀') {
        println("🎉 it's time to deploy to Clever-Cloud 🍾")
        //it's done automatically by Clever-Cloud
      }
    } else {
      // =======COMMIT MESSAGE========
      commitMessage = sh(returnStdout: true, script: "git log -1 --pretty=%B").trim()
      println("👋 commit message: ${commitMessage}")
      
      if(commitMessage.startsWith("deploy")) {
        //TODO, find something to destroy the scaler
        scalerName = commitMessage.split(" ")[1]
         // I want to use it for test deployment
        stage('Time to test 🚧') {
          println("👷 it's time to test your feature branch")
          def nodeHome = tool name: 'nodejs6103', type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'
          
          env.PATH = "${nodeHome}/bin:${env.PATH}"

          sh "clever create -t node ${scalerName} --org wey-yu --region par --alias ${scalerName}"
          
          // get the application id 
          def applicationId = sh(
            script: '''grep -o '"app_id": *"[^"]*"' .clever.json | grep -o '"[^"]*"$' ''',
            returnStdout: true
          ).trim().split('"').last()
          
          println "🙂: ${applicationId}"

          sh "clever env set PORT 8080 --alias ${scalerName}"
          sh "clever scale --flavor pico --alias ${scalerName}"

          sh "git checkout master"
          sh "git branch"
          
          sh "git remote rm clever"
          
          sh "git remote add clever git+ssh://git@push-par-clevercloud-customers.services.clever-cloud.com/${applicationId}.git"
          sh "git push clever master"
        } // end stage
      
      } else {
      
        stage('nothing to do 😀') {
          println("have a nice day")
        }
      
      } // end of if
      
    }
  }
}
