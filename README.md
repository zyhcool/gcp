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
1. 项目id [gcp.projectId]
2. 防火墙规则名称（开放端口）[gcp.networkTags]
3. API密钥 [gcp.skuKey]
4. 序列号生成工具的文件路径 [gcp.seqTool]
5. 授权码文件的存放路径（/data/bfchain/conf）
6. 启动脚本路径（startup.sh） [gcp.startupPath]

1. 服务账号密钥文件路径（设置GOOGLE_APPLICATION_CREDENTIALS环境变量）



















新建项目
服务器开启gcloud命令行工具：
    1. 安装 gcloud cli 工具
    2. 验证登录：gcloud auth login
    3. 切换gcloud作用的项目：gcloud config set project [PROJECT-ID]（查看当前工作项目：gcloud config get-value project）
    4. 设置环境变量GOOGLE_APPLICATION_CREDENTIALS=/path/to/[ServiceAccountSecretFile.json]，客户端（nodejs版sdk）可以读取这个文件进行鉴权，取得某个项目的服务账号的权限来调用谷歌云接口

也可以使用服务账号登录：
    gcloud auth activate-service-account --key-file=/path/to/[ServiceAccountSecretFile.json] [SERVICE_ACCOUNT]
这样可以确保使用gcloud命令行时，不会对其他项目的资源误操作

查看登录账号：gcloud auth list
切换活动账号：gcloud config set account [ACCOUNT]
使用服务账号授权：gcloud auth activate-service-account [ACCOUNT] --key-file=[KEY_FILE]
> [使用服务账号授权](https://cloud.google.com/sdk/docs/authorizing#authorizing_with_a_service_account)
> [activate-service-account](https://cloud.google.com/sdk/gcloud/reference/auth/activate-service-account)




## bfchain关停程序
1. 创建用户组和用户：useradd -m bfchain
2. 设置免密登录：进入/home/bfchain目录，创建.ssh/authorized_keys：`mkdir .ssh;touch authorized_keys`，追加公钥
3. 修改执行文件的权限：chmod 700 ./bfchain


## 服务账号权限表
| IAM权限 | 功能 | 使用来源 |
| --- | --- | --- |
|compute.regions.list |获取地区列表|nodejs sdk(compute.getRegions)|
|compute.zones.list |获取某地区的区域列表|nodejs sdk(compute.getZones)|
| compute.disks.create、compute.instances.create|创建实例|nodejs sdk(zone.createVM)|
| compute.addresses.create、compute.addresses.createInternal、compute.instances.update|保留静态地址|nodejs sdk(address.create)|
| compute.snapshots.list|获取快照列表|nodejs sdk(compute.getSnapshots)|
|compute.snapshots.delete|删除快照|nodejs sdk(snapshot.delete)|
| compute.disks.createSnapshot、compute.snapshots.create|创建快照|nodejs sdk(disk.createSnapshot)|
| compute.regions.get|获取地区信息（配额）|api(compute.regions.get)|
|compute.disks.resize |扩大硬盘容量|api(compute.disks.resize)|
| compute.addresses.delete|释放静态地址|api(compute.addresses.delete)|
|compute.instances.delete |删除实例|nodejs sdk(vm.delete)|

