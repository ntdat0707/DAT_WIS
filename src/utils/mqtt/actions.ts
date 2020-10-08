import mqtt from 'mqtt';

const emqURL = `ws://${process.env.EMQ_HOST}:${process.env.EMQ_PORT}/mqtt`;
const options = {
  clean: true,
  connectTimeout: 40000,
  clientId: `${process.env.EMQ_CLIENTID}`,
  username: `${process.env.EMQ_USERNAME}`,
  password: `${process.env.EMQ_PWD}`
};
const emqx = mqtt.connect(emqURL, options);

export { emqx };
