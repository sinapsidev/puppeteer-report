pipeline {
    agent any
    environment {
        NEXUS3_CREDS = credentials('nexus3')
        IMAGE_NAME='docker.snps.it/snps/puppeteer-report'
        DOCKER_REGISTRY = "docker.snps.it"
    }
    stages {
        stage('Extract version from package.json') {
            when {
                anyOf {
                    branch 'master'
                    branch 'develop'
                }
            }
            steps {
                script {
                    def json = readJSON file: 'package.json'
                    env.VERSION = json.version
                }
                echo "Version read: ${env.VERSION}"
            }
        }
        stage('Build Docker Image') {
            when {
                anyOf {
                    branch 'master'
                    branch 'develop'
                }
            }
            steps {
                sh "docker build -t ${IMAGE_NAME}:${env.VERSION} -t ${IMAGE_NAME}:latest ."
            }
        }
        stage('push Docker Image') {
            when {
                anyOf {
                    branch 'master'
                    branch 'develop'
                }
            }
            steps {
                sh  """
                    docker login -u ${NEXUS3_CREDS_USR} -p ${NEXUS3_CREDS_PSW} ${env.DOCKER_REGISTRY}
                    docker push ${IMAGE_NAME}:${env.VERSION}
                    docker push ${IMAGE_NAME}:latest                
                    """
            }
        }
        stage('Clean docker cache') {
            when {
                anyOf {
                    branch 'master'
                    branch 'develop'
                }
            }
            steps {
                sh "docker system prune -f"
            }
        }
        stage ('Trigger deployment') {
            when {
                branch 'develop'
            }
            steps {
                build(job: 'xdbDeployer/develop', wait: false)
            }
        }
        stage('Deploy to ECS') {
            steps{
                script {
                    build(job: 'xdb-aws-deployer/deployToEcs', wait: true, parameters: [
                                string(name: "deploymentBranch", value: env.BRANCH_NAME),
                                string(name: "project", value: "logica"),
                                string(name: "service", value: "puppeteer"),
                                string(name: "serviceImage", value: "${IMAGE_NAME}:${env.VERSION}"),
                                string(name: "migration", value: "false"),
                                string(name: "migrationImage", value: "false")
                            ])
                }
            }
        }
    }
    post {
        always {
            script {
                if ( currentBuild.currentResult == "SUCCESS" ) {
                    slackSend color: "good", message: "Job: ${env.JOB_NAME} with buildnumber ${env.BUILD_NUMBER} was successful"
                }
                else if( currentBuild.currentResult == "FAILURE" ) { 
                    slackSend color: "danger", message: "Job: ${env.JOB_NAME} with buildnumber ${env.BUILD_NUMBER} was failed"
                }
                else if( currentBuild.currentResult == "UNSTABLE" ) { 
                    slackSend color: "warning", message: "Job: ${env.JOB_NAME} with buildnumber ${env.BUILD_NUMBER} was unstable"
                }
                else {
                    slackSend color: "danger", message: "Job: ${env.JOB_NAME} with buildnumber ${env.BUILD_NUMBER} its resulat was unclear"	
                }
            }
        }
    }
    triggers {
            pollSCM('*/1 * * * *')
        }
    options {
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '3'))
        disableConcurrentBuilds()
    }
}
