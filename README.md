# cdk_sample

cdk를 이용해 ECS Fargate로 

## 파일 설명
<pre>
ROOT
  │
  └─── hello-stack.ts : cdk sample. 
  │
  └─── hello-api
         │
         └─── main.py : sample api service 
         └─── requirements.txt : package list for sample api service
         └─── Dockerfile
  │
  └─── locust
         │
         └─── main.py : script for performance testing
</pre>

## 설명

프로젝트를 아래와 같이 생성한 후 lib 폴더에 hello-stack.ts를 넣고, line 142의 account number와 ecr 저장소를 적용한 후 deploy하세요.

<pre>
mkdir hello
cd hello
cdk init --language typescript
</pre>

### 상세 설명 링크

[CDK로 AWS 인프라 구축하기 - #1 CDK 둘러보기](https://ongamedev.tistory.com/486)

[CDK로 AWS 인프라 구축하기 - #2 VPC 생성 코드 작성하기](https://ongamedev.tistory.com/487)

[CDK로 AWS 인프라 구축하기 - #3 보안 그룹과 RDBMS](https://ongamedev.tistory.com/488)

[CDK로 AWS 인프라 구축하기 - #4 ECS Cluster 구성](https://ongamedev.tistory.com/489)

[CDK로 AWS 인프라 구축하기 - #5 scale out 테스트](https://ongamedev.tistory.com/490)


