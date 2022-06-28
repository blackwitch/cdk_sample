import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, DatabaseSecret, MysqlEngineVersion } from 'aws-cdk-lib/aws-rds'

export class HelloStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = this.build_VPC('Hello'); // VPC 생성 , 생성되어 있다면 생성되어 있던 VPC 정보를 반환
    const sg = this.build_SecurityGroup(vpc);//  보안 그룹 생성
    this.build_ecs(vpc, sg);

    // secret manager를 생성, 로그인 시 secret manager 에서 생성
    credsSecretName의  arn을 복사해서 로그인 가능
    const instanceIdentifier = 'mysql-01'
    const credsSecretName = `/${id}/rds/creds/${instanceIdentifier}`.toLowerCase()
    const creds = new DatabaseSecret(this, 'hello-rdb-credentials', {
      secretName: credsSecretName,
      username: 'admin'
    });
    // mysqls serverless v1으로 생성
    this.build_rdb_serverless(vpc, creds)
  }

  get availabilityZones(): string[] {
    return ['ap-northeast-2a', 'ap-northeast-2c'];
  }

  build_VPC(_id:string){
	try{
	    const vpc = new ec2.Vpc(this, _id, {
	        maxAzs: 2,
	        vpcName : _id,
	        // cidr: '10.0.0.0/16', default
	        // enableDnsHostnames: true, default
	        // enableDnsSupport: true, default
	        subnetConfiguration: [
	          {
	            subnetType: ec2.SubnetType.PUBLIC,
	            cidrMask: 24,
	            name: 'public'
	          },
	          {
	            subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
	            cidrMask: 24,
	            name: 'private'
	          },
	        ],
	    });
	    return vpc;
    }catch(e){
      console.log("ERROR in build_VPC ", _id , " > ", e);
      return null;
    }
  }

  //  name, vpc, desc, allowAllOutbound, ingressrules [{ipv4, port(only tcp), desc}],
  createSecurityGroup(name:string, vpc:ec2.Vpc, desc:string, bAllOutbound:boolean, ingressRules:any){
    const sg = new ec2.SecurityGroup(
      this, name, {
      vpc,
      description: desc,
      allowAllOutbound: bAllOutbound
    });

    ingressRules.forEach((item:any) => 
      sg.addIngressRule(
        (item.ipv4 === 'any') ? ec2.Peer.anyIpv4() : ec2.Peer.ipv4(item.ipv4),
        (typeof item.port === 'number') ? ec2.Port.tcp(item.port) : ec2.Port.tcpRange(item.port[0], item.port[1]),
        item.desc
      )
    );
    return sg;
  }

  build_SecurityGroup(vpc:ec2.Vpc){
    let list_sg:  {[name:string] : ec2.SecurityGroup} = {};
    list_sg.web_80_only_on_public = this.createSecurityGroup('web_80_only_on_public', vpc, '80 port for web service',true, 
      [{ipv4:'any', port:80, desc:'80 port for web service'}]
    );
    list_sg.web_3000_for_private = this.createSecurityGroup('web_3000_for_private', vpc, '3000 and 443 port for web service on private subnet',true, 
      [ {ipv4:'10.0.0.0/16', port:3000, desc:'3000 and 443 port for web service on private subnet'},
        {ipv4:'any', port:443, desc:'443 port for private link'}
      ]
    );
    return list_sg;
  }

  build_rdb_serverless(vpc:ec2.Vpc, creds:DatabaseSecret){
    const cluster = new rds.ServerlessCluster(this, 'hello-rdb-cluster', {
      engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
      credentials: Credentials.fromSecret(creds),
      vpc,
      enableDataApi: true,
      deletionProtection: false,
    });
  }

  build_ecs(vpc:ec2.Vpc, listSG: {[name:string] : ec2.SecurityGroup}){
    // vpc에서 private subnet을 리스트로 가져옵니다. 
    const subnetIds: string[] = [];
    vpc.privateSubnets.forEach((subnet, index) => {
      subnetIds.push(subnet.subnetId);
    });

    //  ECR 접근을 위한 VPC endpoint 설정
    const cfnVPCEndpoint_api = new ec2.CfnVPCEndpoint(this, 'ecs2ecr-api',{
      serviceName: 'com.amazonaws.ap-northeast-2.ecr.api',
      vpcId: vpc.vpcId,
      privateDnsEnabled: true,
      subnetIds : subnetIds,
      securityGroupIds: [listSG.web_3000_for_private.securityGroupId],
      vpcEndpointType: "Interface"
    });
    const cfnVPCEndpoint_dkr = new ec2.CfnVPCEndpoint(this, 'ecs2ecr-dkr',{
      serviceName: 'com.amazonaws.ap-northeast-2.ecr.dkr',
      vpcId: vpc.vpcId,
      privateDnsEnabled: true,
      subnetIds : subnetIds,
      securityGroupIds: [listSG.web_3000_for_private.securityGroupId],
      vpcEndpointType: "Interface"
    });
    const cfnVPCEndpoint_logs = new ec2.CfnVPCEndpoint(this, 'ecs2logs',{
      serviceName: 'com.amazonaws.ap-northeast-2.logs',
      vpcId: vpc.vpcId,
      privateDnsEnabled: true,
      subnetIds : subnetIds,
      securityGroupIds: [listSG.web_3000_for_private.securityGroupId],
      vpcEndpointType: "Interface"
    });    

    //  가져올 이미지의 저장소 위치 지정
    const repository = ecr.Repository.fromRepositoryName(
      this,
      "your_account_id",
      "hello-web"
    );

    // ECS Cluster를 생성
    const cluster_web = new ecs.Cluster(this, 'hello-web', {
      clusterName: 'hello-web',
      containerInsights: true,
      vpc : vpc,
    });
    //  capacity 설정
    cluster_web.addCapacity('hello-web', {
      instanceType: new ec2.InstanceType("t2.small"),
      desiredCapacity: 1, // 초기 instance 생성 개수
      minCapacity: 1,
      maxCapacity: 2,
      // vpcSubnets : default > all private subnets.
    });
    //  task를 정의
    const taskDefinition = new ecs.FargateTaskDefinition(this, "hello-web-task", {
      memoryLimitMiB: 512,
      cpu: 256,
    });
    const container = taskDefinition.addContainer('hello-web-container', {
      // docker image 지정. 위에서 정의한 repository로 설정
      image : ecs.ContainerImage.fromEcrRepository(repository), 
      memoryLimitMiB: 512,
      portMappings: [{ containerPort: 3000 }], // 생성된 웹 서비스는 3000 포트를 사용한다고 가정
    });
    //  Service를 정의
    const fservice = new ecs.FargateService(this, 'hello-web-service', {
      cluster: cluster_web, 
      taskDefinition, 
      desiredCount:1,
      circuitBreaker: {rollback: true}, // 비정상 서비스가 배포된 경우 자동으로 롤백되도록 설정
      securityGroups : [listSG.web_3000_for_private],
      serviceName : 'hello-web-ecs-service'
    });

    // Setup AutoScaling policy
    const scaling = fservice.autoScaleTaskCount({ maxCapacity: 5 });
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
      scaleOutCooldown: Duration.seconds(60),
      scaleInCooldown: Duration.seconds(180),
    });

    // 외부에서의 접근을 위한 alb 설정
    const lb = new elbv2.ApplicationLoadBalancer(this, 'hello-web-alb', {vpc, internetFacing:true});
    const listener = lb.addListener('hello-web-listener', {port:80});
    listener.addTargets('hello-web-target', {
      port: 80,
      targets: [fservice],
      healthCheck: {
        path : '/', // '/index.html', for web
        interval: Duration.minutes(1)
      }
    });
  }
}
