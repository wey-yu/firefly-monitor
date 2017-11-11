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
      stage('Time to test 🚧') {
        println("👷 it's time to test")
        def nodeHome = tool name: 'nodejs6103', type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'
        env.PATH = "${nodeHome}/bin:${env.PATH}"
        sh "clever create -t node firefly-test-02 --org wey-yu --region par --alias firefly-test-02"
        sh "clever env set PORT 8080 --alias firefly-test-02"
        sh "clever scale --flavor pico --alias firefly-test-02"
        sh '''app_id=$(grep -oP '(?<="app_id": ")[^"]*' .clever.json)'''
        sh "git remote add clever git+ssh://git@push-par-clevercloud-customers.services.clever-cloud.com/$app_id.git"
        sh "git push clever master"
        //sh "exit 0"
      }
    }
  }
}
