# from
FROM ubuntu:latest

# apt init
ENV LANG=C.UTF-8
ENV TZ=Asia/Seoul
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y sudo

# python stuff
RUN apt-get install -y python3-pip python3-dev
RUN cd /usr/local/bin && \
    ln -s /usr/bin/python3 python && \
    ln -s /usr/bin/pip3 pip && \
    pip3 install --upgrade pip

# apt cleanse
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# timezone
RUN ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY . ./

# workspace
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app

# install python packages
RUN pip install -r requirements.txt

EXPOSE 3000
CMD uvicorn main:app --workers 4 --host=0.0.0.0 --port=3000