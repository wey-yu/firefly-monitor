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
      println("========================")
      shortCommit = sh(returnStdout: true, script: "git log -1 --pretty=%B").trim()
      println("👋 ${shortCommit}")
      println("========================")
      // I want to use it for deployment
      stage('Time to test 🚧') {
        println("👷 it's time to test your feature branch")
        def nodeHome = tool name: 'nodejs6103', type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'
        def version = "40"
        env.PATH = "${nodeHome}/bin:${env.PATH}"

        sh "clever create -t node firefly-test-${version} --org wey-yu --region par --alias firefly-test-${version}"
       
        def result = sh(
          script: '''grep -o '"app_id": *"[^"]*"' .clever.json | grep -o '"[^"]*"$' ''',
          returnStdout: true
        ).trim().split('"').last()
        println "🙂: ${result}"
        
        sh "clever env set PORT 8080 --alias firefly-test-${version}"
        sh "clever scale --flavor pico --alias firefly-test-${version}"
        
        //sh "git branch"
        sh "git checkout master"
        sh "git branch"
                
        sh "git remote add clever git+ssh://git@push-par-clevercloud-customers.services.clever-cloud.com/${result}.git"
        sh "git push clever master"

      }
    }
  }
}
