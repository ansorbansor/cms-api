from diagrams import Diagram, Cluster, Edge
from diagrams.aws.network import ELB
from diagrams.aws.compute import ECR
from diagrams.aws.database import RDS
from diagrams.aws.database import ElastiCache
from diagrams.aws.integration import SNS
from diagrams.aws.storage import S3
from diagrams.aws.compute import EC2

attributes = {'pad': '1.0', 'fontsize': '18'}
with Diagram('playbook infrastructure with on-premise', show=True, direction='TB', outformat='png', graph_attr=attributes):
    database = RDS('MySQL')
    redis = ElastiCache('Redis')
    storage = S3('MinIO')
    
    with Cluster('Server API'):
        api = ECR('API')
        api >> Edge(label= 'FQDN', color='darkgreen', style='bold') >> database
        api >> Edge(label= 'FQDN', color='darkgreen', style='bold') >> redis
        api >> Edge(label= 'FQDN', color='darkgreen', style='bold') >> storage
    
    with Cluster('Server Website'):
        website = ECR('Website')
        api << Edge(label= 'Transactional Data', color='firebrick', style='dashed') <<  website
    
    with Cluster('Server CMS'):
        cms = ECR('CMS')
        api << Edge(label= '', color='firebrick', style='dashed') <<  cms

    with Cluster('Authentication'):
        ldap = EC2('LDAP')
        api >> Edge(label= 'Login', color='darkgreen', style='dashed') >> ldap
        simsdm = EC2('SIMSDM')
        api >> Edge(label= 'Get User Data', color='darkgreen', style='dashed') >> simsdm

    with Cluster('Course Provider'):
        skillacademy = EC2('Skill Academy')
        api >> Edge(label= '', color='darkgreen', style='dashed') >> skillacademy
        udemy = EC2('Udemy')
        api >> Edge(label= 'Get Data Course', color='darkgreen', style='dashed') >> udemy
        terampil = EC2('Terampil')
        api >> Edge(label= '', color='darkgreen', style='dashed') >> terampil

    with Cluster('Certificate'):
        pionir = EC2('Pionir')
        api << Edge(label= 'Send User Course & Get Certificate', color='firebrick', style='dashed') >>  pionir

    with Cluster('Third Party'):
        webmail = SNS('Webmail')
        api << Edge(label= '587/465', color='firebrick', style='dashed') >> webmail
        fcm = SNS('Google FCM')
        api >> Edge(label= '', color='firebrick', style='dashed') >> fcm
        fcm >> Edge(label= '', color='firebrick', style='dashed') >> website
        fcm >> Edge(label= '', color='firebrick', style='dashed') >> cms
