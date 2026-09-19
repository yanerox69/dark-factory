# Clean-container check for the rehearsal service.
#
# The hackathon requires the service to build and serve from a clean container
# with no outbound network. A service that does not start scores zero, so the
# pattern is rehearsed here before the build window and replicated per stage.
#
#   docker build -t darkfactory-dryrun .
#   docker run --rm --network none darkfactory-dryrun
#
# --network none is the part that matters: anything the service tries to fetch
# at start-up fails there rather than in front of a judge.
#
# NOTE: this service binds 127.0.0.1, as its own spec required, so it is only
# reachable from inside the container and publishing a port does nothing. The
# competition stages must bind 0.0.0.0 to be reachable from outside — read the
# host from an environment variable so local runs can still satisfy a spec that
# asks for the loopback address. See PLAN-BUILD.md.

FROM node:22-alpine

WORKDIR /app

# No dependencies to install: the service is node:http and node:test only.
# Copying package.json first still keeps the layer cache useful if that changes.
COPY package.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/server.js"]
