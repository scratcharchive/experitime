import { useMemo } from "react"
import useFetchCache from "../../../commonComponents/useFetchCache"
import { useBackendProviderClient } from "../../../labbox"
import BackendProviderClient from "../../../labbox/backendProviders/BackendProviderClient"
import {TimeseriesInfo} from '../../workspaceview/WorkspaceView/useExperimentInfo'

// it may be important to limit this when using a filter
// const timeseriesCalculationPool = createCalculationPool({maxSimultaneous: 4, method: 'stack'})

export type TimeseriesData = {
  getChannelData: (channel_name: string, t1: number, t2: number, ds_factor: number) => {timestamps: number[], values: number[]}
  requestChannelData: (channel_name: string, t1: number, t2: number, ds_factor: number) => void
  channelNames: string[]
  startTime: number
  endTime: number
  samplingFrequency: number
}

const getTimeseriesDataSegment = async (args: {client: BackendProviderClient, timeseriesUri: string, channel_name: string, ds_factor: number, segment_num: number, segment_duration_sec: number}): Promise<{timestamps: number[], values: number[]}> => {
  const { client, timeseriesUri, channel_name, ds_factor, segment_num, segment_duration_sec } = args
  const task = client.initiateTask<{timestamps: number[], values: number[]}>(
    'get_timeseries_segment.6',
    {
      timeseries_uri: timeseriesUri,
      channel_name,
      ds_factor,
      segment_num,
      segment_duration_sec
    }
  )
  if (!task) throw Error('Unable to create get_timeseries_segment task')
  return new Promise((resolve, reject) => {
    const check = () => {
      if (task.status === 'finished') {
        if (!task.returnValue) {
          reject('No return value')
          return
        }
        resolve(task.returnValue)
      }
      else if (task.status === 'error') {
        reject(task.errorMessage)
      }
    }
    task.onStatusChanged(status => check())
    check()
  })
}

type TimeseriesDataSegmentQuery = {
  type: 'dataSegment',
  ds_factor: number,
  channel_name: string,
  segment_num: number,
  segment_duration_sec: number
}

type TimeseriesDataQuery = TimeseriesDataSegmentQuery

const useTimeseriesData = (timeseriesInfo: TimeseriesInfo): TimeseriesData | null => {
  const client = useBackendProviderClient()
  if (!client) throw Error('No backend provider client')
  const fetch = useMemo(() => (async (query: TimeseriesDataQuery) => {
    switch(query.type) {
      case 'dataSegment': {
        return await getTimeseriesDataSegment({client, timeseriesUri: timeseriesInfo.uri, ds_factor: query.ds_factor, channel_name: query.channel_name, segment_num: query.segment_num, segment_duration_sec: query.segment_duration_sec})
      }
    }
  }), [client, timeseriesInfo.uri])
  const data = useFetchCache<TimeseriesDataQuery>(fetch)

  // const segment_size_times_num_channels = 100000
  // const num_channels = timeseriesInfo.channelNames.length
  const est_segment_size_timepoints = 1e6
  const segment_duration_sec = Math.ceil(est_segment_size_timepoints / timeseriesInfo.samplingFrequency) // round up to integer so that we don't get any rounding issues

  const getChannelData = useMemo(() => ((channel_name: string, t1: number, t2: number, ds_factor: number): {timestamps: number[], values: number[]} => {
    // Here we are retrieving the channel data, between for timepoints [t1, t2), with downsampling factor ds_factor

    // first we accumulate the information about which segments we need to retrieve
    const i1 = Math.floor(Math.max(t1, timeseriesInfo.startTime) / segment_duration_sec) // index of start segment
    const i2 = Math.floor(Math.min(t2, timeseriesInfo.endTime) / segment_duration_sec) // index of end segment (inclusive)
    const segments: {
      segment_num: number, // the number of the segment
      t1: number, // the starting time for the segment
      t2: number // the ending time for the segment (non-inclusive)
    }[] = []
    for (let i = i1; i <= i2; i++) {
      segments.push({
        segment_num: i,
        t1: i * segment_duration_sec,
        t2: (i + 1) * segment_duration_sec
      })
    }

    // This is the output that we are going to accumulate
    const timestampsList: number[][] = []
    const valuesList: number[][] = []
    // Loop through the segments and append to the output array
    for (let segment of segments) {
      const x = data.get({type: 'dataSegment', ds_factor, channel_name, segment_num: segment.segment_num, segment_duration_sec}) as {timestamps: number[], values: number[]} | undefined
      // x will be undefined if that segment is not yet on the client - in that case the fetch request will be triggered, if not already in process
      if (x) {
        // the data is on the client
        timestampsList.push(x.timestamps)
        valuesList.push(x.values)
      }
    }

    const timestamps = ([] as number[]).concat(...timestampsList)
    const values = ([] as number[]).concat(...valuesList)

    return {
      timestamps: timestamps.filter((t, i) => ((t1 <= timestamps[i]) && (timestamps[i] < t2))),
      values: ds_factor > 1 ? (
        values.filter((v, i) => ((t1 <= timestamps[Math.floor(i / 2)]) && (timestamps[Math.floor(i / 2)] < t2)))
      ) : (
        values.filter((v, i) => ((t1 <= timestamps[i]) && (timestamps[i] < t2)))
      )
    }
  }), [data, segment_duration_sec, timeseriesInfo])

  return useMemo(() => ({
    getChannelData,
    requestChannelData: getChannelData,
    channelNames: timeseriesInfo.channelNames,
    startTime: timeseriesInfo.startTime,
    endTime: timeseriesInfo.endTime,
    samplingFrequency: timeseriesInfo.samplingFrequency
  }), [getChannelData, timeseriesInfo])
}

export default useTimeseriesData