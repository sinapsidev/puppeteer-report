pipeline {
    agent any
    environment {
        NEXUS3_CREDS = credentials('nexus3')
        IMAGE_NAME='docker.snps.it/snps/puppeteer-report'
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
                    docker login -u ${NEXUS3_CREDS_USR} -p ${NEXUS3_CREDS_PSW} docker.snps.it
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
        stage('Trigger deployment AWS logica-dev') {
            agent {
                docker {
                    image 'docker.snps.it/snps/logica-devops-tools'
                    registryUrl 'https://docker.snps.it'
                    registryCredentialsId 'nexus3'
                    args '-u root:root'
                    alwaysPull true
                }
            }
            when {
                anyOf {
                    branch 'develop'
                }
            }
            steps {
                script {
                    withCredentials([file(credentialsId: 'aws-jenkins-credential', variable: 'CREDENTIALS')]) {
                        sh """
                        mkdir -p ~/.aws
                        cp $CREDENTIALS ~/.aws/credentials
                        ~/login-dev.sh
                        helm upgrade --install xdb-puppeteer-report-dev ./helm-chart --values=./helm-chart/values.dev.yaml --set-string buildId=${env.BUILD_NUMBER}
                        kubectl rollout status deploy xdb-puppeteer-report-dev --namespace=logica-dev
                        """
                    }
                }
            }
        }
        stage('Trigger deployment AWS logica-prod') {
            agent {
                docker {
                    image 'docker.snps.it/snps/logica-devops-tools'
                    registryUrl 'https://docker.snps.it'
                    registryCredentialsId 'nexus3'
                    args '-u root:root'
                    alwaysPull true
                }
            }
            when {
                branch 'master'
            }
            steps {
                script {
                    withCredentials([file(credentialsId: 'aws-jenkins-credential', variable: 'CREDENTIALS')]) {
                        sh """
                        mkdir -p ~/.aws
                        cp $CREDENTIALS ~/.aws/credentials
                        ~/login-prod.sh
                        helm package --dependency-update ./helm-chart --version ${env.VERSION} --app-version ${env.VERSION}
                        helm upgrade --install xdb-puppeteer-report-prod ./xdb-puppeteer-report-${env.VERSION}.tgz --values=./helm-chart/values.prod.yaml -n logica-prod
                        kubectl rollout status deploy xdb-puppeteer-report-prod --namespace=logica-prod
                        """
                    }
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
