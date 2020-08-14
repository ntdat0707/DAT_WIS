import { IBaseEmailTemplate } from './index';

interface IStaffRegisterAccountTemplate extends IBaseEmailTemplate {
  staffName: string;
  staffEmail: string;
}

const staffRegisterAccountTemplate = `
<!-- saved from url=(0075)http://lms.myclass.vn/pluginfile.php/12538/mod_lesson/intro/bookTicket.html -->
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,400;1,500;1,700&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Be+Vietnam:wght@100;300;400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <style>
      #resetpw {
        width: 40%;
        min-width: 600px;
        max-width: 700px;
        margin: auto;
        font-family: 'Roboto', sans-serif;
        font-size: 14px;
        padding: 40px;
        background-color: #f0f3f8;
      }
      div {
        box-sizing: border-box;
      }
      header a {
        float: right;
        margin-top: 10px;
        text-decoration: none;
        color: #6658f3;
        font-weight: 700;
        font-family: 'Roboto', sans-serif;
      }
      .main {
        margin-top: 30px;
        background-color: #ffffff;
        border-radius: 14px 14px 40px 14px;
      }
      .main img {
        width: 100%;
      }
      .main p {
        margin: 8px 0;
        line-height: 170%;
      }
      .main .info {
        padding: 20px 40px 30px;
      }

      .main .info h1 {
        color: #070d14;
        font-size: 32px;
        margin: 0px;
        margin-bottom: 25px;
      }

      .main .info__thanks {
        color: #3c3b3b;
        margin-top: 20px;
      }
      .main .info__link {
        color: #07a7c1;
        width: 100%;
        padding: 10px 15px;
        background-color: #f3fcfe;
        display: block;
        box-sizing: border-box;
        font-weight: 500;
      }

      .main .info__contact {
        border-top: 1px solid #f0f3f8;
        padding-top: 25px;
        margin-top: 25px;
      }
      .main .info__button {
        height: 42px;
        width: 180px;
        display: block;
        background-color: #08c4e3;
        margin: 15px 0;
        text-decoration: none;
        border: none;
        color: #ffffff;
        font-weight: bold;
        font-size: 16px;
        border-radius: 4px;
        cursor: pointer;
        padding: 10px;
        box-sizing: border-box;
        text-align: center;
      }
      .main .info__button:focus {
        outline: none;
      }

      footer p {
        color: #727070;
        font-size: 12px;
        text-align: center;
        margin: 5px 0;
      }
      footer {
        margin-top: 20px;
      }
      footer div {
        display: flex;
        justify-content: center !important;
      }
      footer div a {
        margin: 5px;
        color: #727070 !important;
        font-size: 12px;
        cursor: pointer;
      }

      @media screen and (max-width: 575px) {
        html {
          font-size: 40%;
        }
        #resetpw {
          width: 100%;
          min-width: unset;
          padding: 20px 0;
        }
        .resetpw {
          padding: 0;
        }
        header {
          padding: 0 15px;
        }
      }
    </style>
  </head>
  <body>
    <div id="resetpw">
      <div class="resetpw">
        <header>
        <img style="height: 50px" src="https://space-sgp1-01.sgp1.digitaloceanspaces.com/HQeuPMliJnECufjaQ7L-Colorful.png" alt="logo" />
        <a href="https://app.wisere.com" target="blank">
            > Visit website
          </a>
        </header>
        <div class="main">
          <img class="banner" src="https://space-sgp1-01.sgp1.digitaloceanspaces.com/Group%206008.png" alt="banner" />
          <div class="info">
            <h1>
              Welcome to Wisere Partners
            </h1>
            <p>
              Hi {{staffName}}!
            </p>
            <p>
              Thanks for creating an account Business on Wisere - our powerful suite of tools helps, manage your
              schedules.
            </p>

            <p>
              Your username is <strong>{{staffEmail}}</strong>
              <br />
              Log in now and start setting your business for success.
              <br />
            </p>

            <a class="info__button" href="https://app.wisere.com/users/signin" target="_blank">Log in to Wisere</a>

            <div class="info__thanks">
              <p>
                Sincerely,
              </p>
              <p>
                Wisere
              </p>
            </div>
            <div class="info__contact">
              <p style="font-weight: bold;">Contact information</p>
              <p>Email: support@wisere.com</p>
              <p>Hotline: 0913744999</p>
            </div>
          </div>
        </div>
        <footer>
          <p>
            Sent from Wisere
          </p>
          <p>
            Wisere, 268 Tran Hung Dao Street, Ward 11 , District 5, HCMC
          </p>
          <div>
            <a href="https://app.wisere.com" target="blank">Wisere for Business</a>
            <a href="https://app.wisere.com" target="blank">View in browser</a>
            <a href="https://app.wisere.com" target="blank">Unsubscribe</a>
          </div>
        </footer>
      </div>
    </div>
  </body>
</html>

`;

export { staffRegisterAccountTemplate, IStaffRegisterAccountTemplate };