
function calculate2Percent(transfers) {
  let total = 0;
  let profits = 0;
  let agents_prof = 0;
  let isLimitError = false;
  let isTypeError = false;


  transfers.forEach(n => {
    if (isNaN(n)) {
      isTypeError = true;
      return;
    }
        if (Number(n) % 50 === 0) {
          total += Number(n);
          profits += (n * 10) / 100;
          agents_prof += (n * 2) / 100;
          return;
        } else {
          if (n >= 5 && n <= 50) {
            total += Number(n);
            profits += 5;
            agents_prof += 1;
            return;
          }
          //All other coditions tested
          else if (n >= 55 && n <= 100) {
            profits += 10;
            agents_prof += 2;
            total += Number(n);
            return;
          } else if (n >= 105 && n <= 150) {
            profits += 15;
            agents_prof += 3;
            total += Number(n);
            return;
          } else if (n >= 155 && n <= 200) {
            profits += 20;
            agents_prof += 4;
            total += Number(n);
            return;
          } else if (n >= 205 && n <= 250) {
            profits += 25;
            agents_prof += 5;
            total += Number(n);
            return;
          } else if (n >= 255 && n <= 300) {
            profits += 30;
            agents_prof += 6;
            total += Number(n);
            return;
          } else if (n >= 305 && n <= 350) {
            profits += 35;
            agents_prof += 7;
            total += Number(n);
            return;
          } else if (n >= 355 && n <= 400) {
            profits += 40;
            agents_prof += 8;
            total += Number(n);
            return;
          } else if (n >= 405 && n <= 450) {
            profits += 45;
            agents_prof += 9;
            total += Number(n);
            return;
          } else if (n >= 455 && n <= 500) {
            profits += 50;
            agents_prof += 10;
            total += Number(n);
            return;
          } else if (n >= 505 && n <= 550) {
            profits += 55;
            agents_prof += 11;
            total += Number(n);
            return;
          } else if (n >= 555 && n <= 600) {
            profits += 60;
            agents_prof += 12;
            total += Number(n);
            return;
          } else if (n >= 605 && n <= 650) {
            profits += 65;
            agents_prof += 13;
            total += Number(n);
            return;
          } else if (n >= 655 && n <= 700) {
            profits += 70;
            agents_prof += 14;
            total += Number(n);
            return;
          } else if (n >= 705 && n <= 750) {
            profits += 75;
            agents_prof += 15;
            total += Number(n);
            return;
          } else if (n >= 755 && n <= 800) {
            profits += 80;
            agents_prof += 16;
            total += Number(n);
            return;
          } else if (n >= 805 && n <= 850) {
            profits += 85;
            agents_prof += 17;
            total += Number(n);
            return;
          } else if (n >= 855 && n <= 900) {
            profits += 90;
            agents_prof += 18;
            total += Number(n);
            return;
          } else if (n >= 905 && n <= 950) {
            profits += 95;
            agents_prof += 19;
            total += Number(n);
            return;
          } else if (n >= 955 && n <= 1000) {
            profits += 100;
            agents_prof += 20;
            total += Number(n);
            return;
          }

          //handle +1000
          else if (n >= 1005 && n <= 1050) {
            profits += 105;
            agents_prof += 21;
            total += Number(n);
            return;
          } else if (n >= 1055 && n <= 1100) {
            profits += 110;
            agents_prof += 22;
            total += Number(n);
            return;
          } else if (n >= 1105 && n <= 1150) {
            profits += 115;
            agents_prof += 23;
            total += Number(n);
            return;
          } else if (n >= 1155 && n <= 1200) {
            profits += 120;
            agents_prof += 24;
            total += Number(n);
            return;
          } else if (n >= 1205 && n <= 1250) {
            profits += 125;
            agents_prof += 25;
            total += Number(n);
            return;
          } else if (n >= 1255 && n <= 1300) {
            profits += 130;
            agents_prof += 26;
            total += Number(n);
            return;
          } else if (n >= 1305 && n <= 1350) {
            profits += 135;
            agents_prof += 27;
            total += Number(n);
            return;
          } else if (n >= 1355 && n <= 1400) {
            profits += 140;
            agents_prof += 28;
            total += Number(n);
            return;
          } else if (n >= 1405 && n <= 1450) {
            profits += 145;
            agents_prof += 29;
            total += Number(n);
            return;
          } else if (n >= 1455 && n <= 1500) {
            profits += 150;
            agents_prof += 30;
            total += Number(n);
            return;
          } else if (n >= 1505 && n <= 1550) {
            profits += 155;
            agents_prof += 31;
            total += Number(n);
            return;
          } else if (n >= 1555 && n <= 1600) {
            profits += 160;
            agents_prof += 32;
            total += Number(n);
            return;
          } else if (n >= 1605 && n <= 1650) {
            profits += 165;
            agents_prof += 33;
            total += Number(n);
            return;
          } else if (n >= 1655 && n <= 1700) {
            profits += 170;
            agents_prof += 34;
            total += Number(n);
            return;
          } else if (n >= 1705 && n <= 1750) {
            profits += 175;
            agents_prof += 35;
            total += Number(n);
            return;
          } else if (n >= 1755 && n <= 1800) {
            profits += 180;
            agents_prof += 36;
            total += Number(n);
            return;
          } else if (n >= 1805 && n <= 1850) {
            profits += 185;
            agents_prof += 37;
            total += Number(n);
            return;
          } else if (n >= 1855 && n <= 1900) {
            profits += 190;
            agents_prof += 38;
            total += Number(n);
            return;
          } else if (n >= 1905 && n <= 1950) {
            profits += 195;
            agents_prof += 39;
            total += Number(n);
            return;
          } else if (n >= 1955 && n <= 2000) {
            profits += 200;
            agents_prof += 40;
            total += Number(n);
            return;
          }

          //handle + 2 thous&&s
          else if (n >= 2005 && n <= 2050) {
            profits += 205;
            agents_prof += 41;
            total += Number(n);
            return;
          } else if (n >= 2055 && n <= 2100) {
            profits += 210;
            agents_prof += 42;
            total += Number(n);
            return;
          } else if (n >= 2105 && n <= 2150) {
            profits += 215;
            agents_prof += 43;
            total += Number(n);
            return;
          } else if (n >= 2155 && n <= 2200) {
            profits += 220;
            agents_prof += 44;
            total += Number(n);
            return;
          } else if (n >= 2205 && n <= 2250) {
            profits += 225;
            agents_prof += 45;
            total += Number(n);
            return;
          } else if (n >= 2255 && n <= 2300) {
            profits += 230;
            agents_prof += 46;
            total += Number(n);
            return;
          } else if (n >= 2305 && n <= 2350) {
            profits += 235;
            agents_prof += 47;
            total += Number(n);
            return;
          } else if (n >= 2355 && n <= 2400) {
            profits += 240;
            agents_prof += 48;
            total += Number(n);
            return;
          } else if (n >= 2405 && n <= 2450) {
            profits += 245;
            agents_prof += 49;
            total += Number(n);
            return;
          } else if (n >= 2455 && n <= 2500) {
            profits += 250;
            agents_prof += 50;
            total += Number(n);
            return;
          } else if (n >= 2505 && n <= 2550) {
            profits += 255;
            agents_prof += 51;
            total += Number(n);
            return;
          } else if (n >= 2555 && n <= 2600) {
            profits += 260;
            agents_prof += 52;
            total += Number(n);
            return;
          } else if (n >= 2605 && n <= 2650) {
            profits += 265;
            agents_prof += 53;
            total += Number(n);
            return;
          } else if (n >= 2655 && n <= 2700) {
            profits += 270;
            agents_prof += 54;
            total += Number(n);
            return;
          } else if (n >= 2705 && n <= 2750) {
            profits += 275;
            agents_prof += 55;
            total += Number(n);
            return;
          } else if (n >= 2755 && n <= 2800) {
            profits += 280;
            agents_prof += 56;
            total += Number(n);
            return;
          } else if (n >= 2805 && n <= 2850) {
            profits += 285;
            agents_prof += 57;
            total += Number(n);
            return;
          } else if (n >= 2855 && n <= 2900) {
            profits += 290;
            agents_prof += 58;
            total += Number(n);
            return;
          } else if (n >= 2905 && n <= 2950) {
            profits += 295;
            agents_prof += 59;
            total += Number(n);
            return;
          } else if (n >= 2955 && n <= 3000) {
            profits += 300;
            agents_prof += 60;
            total += Number(n);
            return;
          } else {
            isLimitError = true;
          }
          // give a maximum entry of 3000 in one go.
          //return error message if it's reached
        }
        total += Number(n);
      });
   return {
    isTypeError,
    isLimitError,
    total,
    profits,
    agents_prof
  };
}

const t = calculate2Percent([45,60,100])

console.log(t)