while true; do date && curl -m 5 http://localhost:1337/healthcheck && echo; sleep 1; done
