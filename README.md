# 准备工作

## bfchain 数据主机

### 部署bfchain
最好部署在东京，区域编码：`asia-northeast1`
### 下载jq工具
```yum install -y jq```
### 创建数据主机快照
以bfchain数据主机的挂载磁盘为来源磁盘，创建快照

位置设定为多区域：`asia` 亚太地区
### 创建快照时间表
频率：每天

开始时间：0点（utc时间：16:00）

并将该快照时间表挂接到数据主机磁盘

### 创建API密钥

> [API和服务-凭据](https://console.cloud.google.com/apis/credentials?project=gcp-test-293701)

该密钥用于访问skus的api

### 创建服务账号及密钥

> [API和服务-凭据](https://console.cloud.google.com/apis/credentials?project=gcp-test-293701)

> [创建服务账号密钥](https://console.cloud.google.com/apis/credentials/serviceaccountkey?_ga=2.52990255.64945074.1606100676-800818242.1591943032&project=gcp-test-293701&folder&organizationId)

该密钥使用json文件保存，用于对资源访问的凭证（资源包括 Compute Engine 等）

该凭证保存在服务器上，供谷歌云平台的sdk代码（node）使用


## 实施平台服务主机


### 设置环境变量 

> [身份验证入门](https://cloud.google.com/docs/authentication/getting-started)

即服务账号密钥的存放路径：
GOOGLE_APPLICATION_CREDENTIALS=/var/local/gcp-auth.json

## 配置信息
1. 项目id
2. 防火墙规则名称（开放端口）
3. API密钥
4. 服务账号及密钥文件
5. 序列号生成工具的文件路径
6. 授权码文件的存放路径



















新建项目
服务器开启gcloud命令行工具：
    1. 安装 gcloud cli 工具
    2. 验证登录：gcloud auth login
    3. 切换gcloud作用的项目：gcloud config set project [PROJECT-ID]（查看当前工作项目：gcloud config get-value [PROJECT-ID]）
    4. 








