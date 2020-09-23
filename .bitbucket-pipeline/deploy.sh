docker pull registry.digitalocean.com/wisere/wisere
tar -xzvf /data/deployment.tar.gz -C /data/
cd /data && docker-compose -f docker-compose.prod.yml down 
docker rmi $(docker images --filter "dangling=true" -q --no-trunc) || true
cd /data && docker-compose -f docker-compose.prod.yml up --build -d --force-recreate