node {

    stage("Prepare"){
        echo "Preparing..."
        checkout scm // 代码签出
        echo "Prepare success"
    }

    stage('Build') {
        echo "Building..."
        sh "docker build -t gcp ."
        // sh "docker images | grep none | awk '{print \$3}' | xargs docker rmi || true " // 删除标签为none的镜像
        echo "Build success"
    }

    stage('Deploy-Testing-Env') {
        echo "Deploying..."
        sh "docker-compose up -d"
        echo "Deploy success"
    }
}
