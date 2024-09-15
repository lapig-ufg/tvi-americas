FROM lapig/app_base:stable_1.4

# Clone app and npm install on server
ENV URL_TO_APPLICATION_GITHUB="https://github.com/lapig-ufg/tvi-americas.git"
ENV BRANCH="master"

LABEL maintainer="Tharles de Sousa Andrade <irtharles@gmail.com> e Rocha Jairo <devjairomr.gmail.com.br>"

RUN if [ -d "/APP/tvi-americas" ]; then rm -Rf /APP/tvi-americas; fi  && \
    cd /APP && git clone -b ${BRANCH} ${URL_TO_APPLICATION_GITHUB}
    
ADD ./src/server/node_modules /APP/tvi-americas/src/server/node_modules

CMD [ "/bin/bash", "-c", "/APP/tvi-americas/src/server/prod-start.sh; tail -f /APP/tvi-americas/src/server/app.out"]

ENTRYPOINT [ "/APP/Monitora.sh"]