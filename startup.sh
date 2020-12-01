#! /bin/bash

password=$1
url=$2
orderNumber=$3
target=$4
token=$5

# 检查并安装jq
prepareJq(){
    if ! rpm -aq | grep jq > /dev/null
    then
        yum install jq -y > /dev/null
    fi
}
prepareJq

# 确保授权文件存放路径存在
prepareDir(){
    if [[ ! -e /data/bfchain/conf ]]
    then
        mkdir -p /data/bfchain/conf
    fi
}
prepareDir

# 根据某些条件判断bfchain是否已经授权成功并启动
# if ! ps -ef | grep -w bcf | grep -v grep > /dev/null
# then
sudo su root
# 修改root用户密码
passwd root << EOF
$password
$password
EOF

# 获取序列号
seqNum=$(/var/local/mysh/seqNum.sh)

# http请求获取授权文件
curl -X POST $url -H "token:$token" -d "sequenceCode=${seqNum}&orderNumber=${orderNumber}&target=${target}" | jq ".data" > /data/bfchain/conf/peerLicense.data



# 重启BFChain
echo "success" > /var/local/mysh/success
# fi
