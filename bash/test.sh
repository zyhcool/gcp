#! /bin/bash

# 检查并安装jq
url=http://localhost:3100/authorize
  # 获取序列号
    seqNum=$(./bash/seqNum.sh)
    echo $seqNum

    # http请求获取授权文件
    curl -X PUT $url -d "email=fake&s=${seqNum}"