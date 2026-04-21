pipeline {
  agent any

  environment {
    RGAA_THRESHOLD = '85'
    BASE_URL = 'https://dequeuniversity.com/demo/dream'
    AI_PROVIDER = 'heuristic'
  }

  stages {
    stage('Install dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Run WDIO RGAA tests') {
      steps {
        sh 'npm run test:a11y'
      }
      post {
        always {
          archiveArtifacts artifacts: 'reports/**/*', allowEmptyArchive: true
        }
      }
    }

    stage('Generate accessibility report') {
      steps {
        sh 'npm run report:summary'
        publishHTML(target: [
          reportDir: 'reports',
          reportFiles: 'rgaa-compliance-report.html',
          reportName: 'RGAA Compliance Report',
          keepAll: true,
          alwaysLinkToLastBuild: true,
          allowMissing: true
        ])
      }
    }

    stage('Parse JSON threshold') {
      steps {
        script {
          def report = readJSON file: 'reports/rgaa-compliance-report.json'
          def compliance_score = report.summary.compliance_score as Integer

          if (compliance_score < env.RGAA_THRESHOLD.toInteger()) {
            error("Accessibility compliance failed: ${compliance_score}% < ${env.RGAA_THRESHOLD}%")
          }
        }
      }
    }
  }

  post {
    failure {
      script {
        if (env.SLACK_WEBHOOK_URL?.trim()) {
          sh '''
            curl -X POST -H 'Content-type: application/json' \
              --data "{\"text\":\"RGAA accessibility build failed for ${JOB_NAME} #${BUILD_NUMBER}: ${BUILD_URL}\"}" \
              "$SLACK_WEBHOOK_URL"
          '''
        }
      }
    }
  }
}
