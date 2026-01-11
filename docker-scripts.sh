#!/$bin/bash

# development
dev(){
    docker-compose -f docker-compose.dev.yml up --build
}

# production
prod() {
    docker-compose up --build -d 
}

# stop all
stop() {
    docker-compose down
    docker-compose docker-compose.dev.yml down
}

# clean
clean() {
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
    docker-system prune-af
}

#logs
logs() {
    docker-compose logs -f
}

# case statement for commands

case "$1" in
 dev)
  dev
  ;;
 prod)
  prod
 ;;
 stop)
  stop
  ;;
 clean)
  clean
  ;;
 logs)
  logs
  ;;
 *)
 
 echo "Usage: $0 {dev|prod|stop|clean|logs}
 exit 1

esac


