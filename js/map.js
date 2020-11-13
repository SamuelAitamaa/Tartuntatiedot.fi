'use strict';

( ( ) => {

  //search for a Open Street Map
  let map = L.map('map', {
    minZoom: 5,
    maxZoom: 7
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  //Set mapview in the center of Finland
  map.setView([65.5538179, 25.7496755], 5);


  map.createPane('labels');
  map.getPane('labels').style.zIndex = 650;
  map.getPane('labels').style.pointerEvents = 'none';

  let positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
    attribution: '©OpenStreetMap, ©CartoDB'
  }).addTo(map);

  let positronLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
    attribution: '©OpenStreetMap, ©CartoDB',
    pane: 'labels'
  }).addTo(map);


  //fetch confirmed and death cases
  //search the number of cases by Health Care District or University Hospital
  //creates html
  //returns confirmed cases for the map use
  async function fetchApi() {
    try {
      const response = await fetch(
          'https://w3qa5ydb4l.execute-api.eu-west-1.amazonaws.com/prod/finnishCoronaData/v2');
      if (!response.ok) throw new Error('jokin meni pieleen');
      const formattedResponse = await response.json();

      const confirmedCases = getConfirmedCases(formattedResponse);
      const healthCareDistricts = getConfirmedHCDistricts(confirmedCases);
      const cCases = getValuesBy(healthCareDistricts);
      //for html
      const div = document.querySelector('#info');
      let content = `<ul>`;

      const casesLastDate = confirmedLastDate(confirmedCases);

      const totalc = formattedResponse.confirmed.length;
      content += `<li><strong>Vahvistetut tartunnat yhteensä: </strong> ${totalc}</li>`;
      document.getElementById("cumulativeLineChartHeader").innerHTML += `<b>${totalc}</b>`;

      const totald = formattedResponse.deaths.length;
      content += `<li><strong>Kuolleita yhteensä: </strong>${totald}</li>`;
      document.getElementById("cumulativeDeathsHeader").innerHTML += `<b>${totald}</b>`;

      content += `<li><b>Viimeisen vrk:n vahvistetut tartunnat: </b> ${casesLastDate}</li>`;
      document.getElementById("confirmedCasesByDateLineChartHeader").innerHTML += `<b>${casesLastDate}</b>`;

      const recovered = formattedResponse.recovered.length;
      content += `<li><strong>Parantuneita: </strong>${recovered}</li>`;

      const lastUpdate = formattedResponse.confirmed.pop().date;
      let d = new Date(lastUpdate);
      content += `<li><b>Tiedot päivitetty: </b> ${Intl.DateTimeFormat(
          ['ban', 'id']).format(d)}</li>`;
      content += `</ul>`;
      div.innerHTML = content;
      return cCases;

    } catch (error) {
      console.log(error);
    }
  }

  //finds all confirmed cases
  const getConfirmedCases = (data) => data.confirmed;

  //finds all confirmed cases by district
  const getConfirmedHCDistricts = (data) =>  data.map(confirmedCase => confirmedCase.healthCareDistrict);

  const getConfirmedDate = (data) => data.map(confirmedCase => confirmedCase.date);

  //finds all death cases
  const getDeathCases = (data) => (data.deaths )

  //finds death cases by university hospital
  const getDeathsbyArea = (data) => ( data.map(confirmedCase => confirmedCase.area) )

  //maps arrays per key and value
  const getValuesBy = (data) => {
    const map = new Map();
    data.forEach(function(keyValue) {
      if (map.has(keyValue)) {
        let count = map.get(keyValue);
        count++;
        map.set(keyValue, count);
      } else {
        map.set(keyValue, 1);
      }
    });
    return map;
  }

  function confirmedLastDate(data) {
    let indices = [];
    const dates = getConfirmedDate(data);
    let lastDate = dates.pop();
    let idx = dates.indexOf(lastDate);
    while (idx != -1) {
      indices.push(idx);
      idx = dates.indexOf(lastDate, idx + 1);
    }
    return indices.length + 1;
  }

  const legend = L.control({position: 'topright'});

  legend.onAdd = (map) => {

    const div = L.DomUtil.create('div', 'info legend'),
        grades = [ 10, 50, 100, 200, 500, 1000, 3000],
        labels = [];

    labels.push(
        '<i style="background:' + '#FED976 "></i>' + grades[0] + '-' + grades[1] + '<br>' +
        '<i style="background:' + '#FEB24C "></i>' + grades[1] + '-' + grades[2] + '<br>' +
        '<i style="background:' + '#FD8D3C "></i>' + grades[2] + '-' + grades[3] + '<br>' +
        '<i style="background:' + '#FC4E2A "></i>' + grades[3] + '-' + grades[4] + '<br>' +
        '<i style="background:' + '#E31A1C "></i>' + grades[4] + '-' + grades[5] + '<br>' +
        '<i style="background:' + '#BD0026 "></i>' + grades[5] + '-' + grades[6] + '<br>' +
        '<i style="background:' + '#800026 "></i>' + grades[6] + '+' + '<br>'
    )


    div.innerHTML = labels.join('<br>');
    return div;
  };

  legend.addTo(map);

  //fetch coordinates of the health care districts
  //create map features
  async function fetchData(myData) {
    try {
      const response = await fetch(
          'https://raw.githubusercontent.com/VuokkoH/koronavirus-avoindata/master/healthDistrictsEPSG4326.geojson',
          {mode: 'cors'});
      if (!response.ok) throw new Error('jokin meni pieleen');
      const data = await response.json();
      L.geoJson(data, {
        highlightFeature: (e) => {
          let layer = e.target;

          layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
          });

          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
          }
        },
        style: (feature, layer) => {
          const cases = myData.get(feature.properties.healthCareDistrict);
          getColor(cases);
          return {
            color:
                cases > 3000 ? '#800026' :
                    cases > 1000  ? '#BD0026' :
                        cases > 500  ? '#E31A1C' :
                            cases > 200  ? '#FC4E2A' :
                                cases > 100   ? '#FD8D3C' :
                                    cases > 50   ? '#FEB24C' :
                                        cases > 10   ? '#FED976' :
                                            '#FFEDA0',
            weight: 2,
            opacity: 1,
            dashArray: '3',
            fillOpacity: 0.7
          };
        },

        onEachFeature: (feature, layer) => {
          let popupContent = '<h3>Tartunnat sairaanhoitopiireittäin: </h3> ' +
              '<h4>' + feature.properties.healthCareDistrict + ' ' +
              myData.get(feature.properties.healthCareDistrict) + '</h4>';
          if (feature.properties && feature.properties.popupContent) {
            popupContent += feature.properties.popupContent;
          }
          layer.bindPopup(popupContent);

        },
      }).addTo(map);

    } catch (error) {
      console.log(error);
    }
  }
  const getColor = (cases) => {
    return {
      color:
          cases > 3000 ? '#800026' :
              cases > 1000 ? '#BD0026' :
                  cases > 500 ? '#E31A1C' :
                      cases > 200 ? '#FC4E2A' :
                          cases > 100 ? '#FD8D3C' :
                              cases > 50 ? '#FEB24C' :
                                  cases > 10 ? '#FED976' :
                                      '#FFEDA0'
    }
  }

  //needed in order to fetches to function
  //passes the values from fetchApi() to fetchData()
  (async () => {
    const values = await fetchApi();
    await fetchData(values);
  })();
})();

async function test() {
  try {
    const response = await fetch(
        'https://w3qa5ydb4l.execute-api.eu-west-1.amazonaws.com/prod/hcdTestData',
        {mode: 'cors'});
    if (!response.ok) throw new Error('jokin meni pieleen');
    const data = await response.json();
    //console.log(data);

  } catch (error) {
    console.log(error);
  }
}

test();