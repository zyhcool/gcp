#! /bin/bash

## 适用于centos7/8 ##
## 适用 root 用户身份执行

# docker
yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

yum install -y yum-utils device-mapper-persistent-data lvm2

yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

yum install -y docker-ce docker-ce-cli containerd.io

systemctl start docker

systemctl enable docker


# docker-compose
curl -L "https://github.com/docker/compose/releases/download/1.25.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

chmod +x /usr/local/bin/docker-compose


# git
yum install -y git

# nodejs
curl --silent --location https://rpm.nodesource.com/setup_14.x | bash -

yum install nodejs -y

# typescript
npm install -g typescript ts-node-dev






