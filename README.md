# cdk_sample

cdk를 이용해 ECS Fargate 서비스를 구축하고 부하 테스트를 해보는 샘플 프로젝트입니다. 

![image](https://user-images.githubusercontent.com/6980454/175436242-9f7b9ade-6d15-43ab-ac82-2922e5e685d4.png)

hello-stack.ts에는 기본적인 VPC와 관련된 설정 방법과 보안 그룹 생성/적용하는 방법, RDS 생성과 ECS 구축에 대한 예제를 포함하고 있습니다.

상세한 내용은 아래를 참고하세요.

## 파일 설명
<pre>
ROOT
  │
  └─── hello-stack.ts : cdk sample. 
  │
  └─── hello-api
         │
         └─── main.py : sample api service 
         └─── requirements.txt : module list
         └─── Dockerfile
  │
  └─── locust
         │
         └─── main.py : script for performance testing
</pre>

## 설명

이 샘플 진행을 위해 aws cli, nodejs, python 3.x 가 설치되어 있어야 합니다.

hello-api를 docker로 빌드하여 ecr에 업로드 한 후, 프로젝트를 아래와 같이 생성하세요.

이후 lib 폴더에 hello-stack.ts를 넣고 line 142의 account number와 ecr 저장소를 적용한 후 deploy하면 됩니다.

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
