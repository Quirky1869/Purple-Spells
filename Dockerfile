FROM nginx:1.29.6-alpine

COPY ./purple-spells/ /usr/share/nginx/html

RUN rm /usr/share/nginx/html/index.html
RUN mv /usr/share/nginx/html/Purple-Spells.html /usr/share/nginx/html/index.html


EXPOSE 80 65501

# docker build . -t purple
# docker run -d -p 9999:80 purple
# docker rmi purple
