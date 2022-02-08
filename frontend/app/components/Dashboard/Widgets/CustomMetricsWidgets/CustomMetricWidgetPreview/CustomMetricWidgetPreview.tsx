import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Loader, NoContent, Icon } from 'UI';
import { widgetHOC, Styles } from '../../common';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid, Area, Tooltip } from 'recharts';
import { LineChart, Line, Legend } from 'recharts';
import Period, { LAST_24_HOURS, LAST_30_MINUTES, YESTERDAY, LAST_7_DAYS } from 'Types/app/period';
import stl from './CustomMetricWidgetPreview.css';
import { getChartFormatter } from 'Types/dashboard/helper'; 
import { remove } from 'Duck/customMetrics';
import DateRange from 'Shared/DateRange';
import { edit } from 'Duck/customMetrics';

import APIClient from 'App/api_client';

const customParams = rangeName => {
  const params = { density: 70 }

  if (rangeName === LAST_24_HOURS) params.density = 70
  if (rangeName === LAST_30_MINUTES) params.density = 70
  if (rangeName === YESTERDAY) params.density = 70
  if (rangeName === LAST_7_DAYS) params.density = 70
  
  return params
}

interface Props {
  metric: any;
  data?: any;
  showSync?: boolean;
  // compare?: boolean;
  onClickEdit?: (e) => void;
  remove: (id) => void;
  edit: (metric) => void;
}
function CustomMetricWidget(props: Props) {
  const { metric, showSync } = props;
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>({ chart: [{}] })
  const [seriesMap, setSeriesMap] = useState<any>([]);
  const [period, setPeriod] = useState(Period({ rangeName: metric.rangeName, startDate: metric.startDate, endDate: metric.endDate }));

  const colors = Styles.customMetricColors;
  const params = customParams(period.rangeName)
  const gradientDef = Styles.gradientDef();
  const metricParams = { ...params, metricId: metric.metricId, viewType: 'lineChart' }

  useEffect(() => {
    new APIClient()['post']('/custom_metrics/try', { ...metricParams, ...metric.toSaveData() })
      .then(response => response.json())
      .then(({ errors, data }) => {
        if (errors) {
          console.log('err', errors)
        } else {
          const namesMap = data
            .map(i => Object.keys(i))
            .flat()
            .filter(i => i !== 'time' && i !== 'timestamp')
            .reduce((unique: any, item: any) => {
              if (!unique.includes(item)) {
                unique.push(item);
              }
              return unique;
            }, []);

          setSeriesMap(namesMap);
          setData(getChartFormatter(period)(data));
        }
      }).finally(() => setLoading(false));
  }, [metric])

  const onDateChange = (changedDates) => {
    setPeriod({  ...changedDates, rangeName: changedDates.rangeValue })
    props.edit({  ...changedDates, rangeName: changedDates.rangeValue });
  }

  return (
    <div className="mb-10">
      <div className="flex items-center mb-4">
        <div className="mr-auto font-medium">Preview</div>
        <div>
          <DateRange
            rangeValue={metric.rangeName}
            startDate={metric.startDate}
            endDate={metric.endDate}
            onDateChange={onDateChange}
            customRangeRight
            direction="left"
          />
        </div>
      </div>
      <div className={stl.wrapper}>
        <div>
          <Loader loading={ loading } size="small">
            <NoContent
              size="small"
              show={ data.length === 0 }
            >
              <ResponsiveContainer height={ 240 } width="100%">
                <LineChart
                  data={ data }
                  margin={Styles.chartMargins}
                  syncId={ showSync ? "domainsErrors_4xx" : undefined }
                >
                  {/* <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[1]} stopOpacity={ 1} />
                      <stop offset="95%" stopColor={colors[2]} stopOpacity={ 1 } />
                      <stop offset="95%" stopColor={colors[3]} stopOpacity={ 1 } />
                    </linearGradient>
                  </defs> */}
                  <CartesianGrid strokeDasharray="3 3" vertical={ false } stroke="#EEEEEE" />
                  <XAxis
                    {...Styles.xaxis}
                    dataKey="time"
                    interval={params.density/7}
                  />
                  <YAxis 
                    {...Styles.yaxis}
                    allowDecimals={false}
                    label={{  
                      ...Styles.axisLabelLeft,
                      value: "Number of Sessions"
                    }}
                  />
                  <Legend />
                  <Tooltip {...Styles.tooltip} />
                  { seriesMap.map((key, index) => (
                    <Line
                      key={key}
                      name={key}
                      type="monotone"
                      dataKey={key}
                      stroke={colors[index]}
                      fillOpacity={ 1 }
                      strokeWidth={ 2 }
                      strokeOpacity={ 1 }
                      // fill="url(#colorCount)"
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </NoContent>
          </Loader>
        </div>
      </div>
    </div>
  );
}

export default connect(null, { remove, edit })(CustomMetricWidget);