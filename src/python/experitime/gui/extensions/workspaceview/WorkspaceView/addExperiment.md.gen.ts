const text: string = "To add an experiment to this workspace, run a Python script on the computer running the backend provider.\n\n## Using numpy arrays\n\nHere is an example script that generates an experiment with a multi-channel continuous timeseries\n\n```python\nimport math\nimport numpy as np\nimport experitime\n\nworkspace_uri = '{workspaceUri}'\nexperiment_name = 'example-experiment'\n\n# Define a timeseries\nsampling_frequency_hz = 30000\nduration_sec = 10\nnum_channels = 8\nnum_samples = math.floor(duration_sec * sampling_frequency_hz)\ntimestamps = np.array(np.arange(num_samples)) / sampling_frequency_hz\nvalues = np.zeros((num_samples, num_channels), dtype=np.float32)\nfor c in range(1, num_channels + 1):\n    cos_freq_hz = c\n    values[:, c - 1] = np.cos(timestamps * cos_freq_hz * (2 * math.pi)) + np.random.normal(0, 1, timestamps.shape) * 0.2\nchannel_names = [str(c) for c in range(1, num_channels + 1)]\ntimeseries = experitime.Timeseries.from_numpy(channel_names=channel_names, timestamps=timestamps, values=values, type='continuous')\n\n# Define a new experiment and add the timeseries\nE = experitime.Experiment(experiment_name)\nE.add_timeseries('example_timeseries', timeseries)\n\n# Load the workspace and add the experiment\nW = experitime.load_workspace(workspace_uri)\nW.add_experiment(E)\n```\n\n## Using SpikeInterface\n\nTo import a timeseries from a SpikeInterface recording\n\n```python\nimport experitime\nimport spikeextractors as se\n\nworkspace_uri = '{workspaceUri}'\nexperiment_name = 'spikeinterface-example-experiment'\n\n# generate a spikeinterface recording\nrecording, sorting_true = se.example_datasets.toy_example(duration=60, num_channels=12)\n\n# create a timeseries\ntimeseries = experitime.Timeseries.from_spikeinterface_recording(recording)\n\n# Define a new experiment and add the recording\nE = experitime.Experiment(experiment_name)\nE.add_timeseries('spikeinterface-recording', timeseries)\n\n# Load the workspace and add the experiment\nW = experitime.load_workspace(workspace_uri)\nW.add_experiment(E)\n```\n\n## Spike trains\n\nTo import discrete spike trains from a SpikeInterface recording/sorting pair\n\n```python\nimport numpy as np\nimport experitime\nimport spikeextractors as se\n\nworkspace_uri = '{workspaceUri}'\nexperiment_name = 'spike-trains-example-experiment'\n\n# generate a spikeinterface recording\nrecording, sorting_true = se.example_datasets.toy_example(duration=60, num_channels=12)\n\n# create a timeseries\ntimeseries = experitime.Timeseries.from_spikeinterface_recording(recording)\n\n# Define a new experiment and add the recording\nE = experitime.Experiment(experiment_name)\nE.add_timeseries('ephys-recording', timeseries)\n\n# Add the spike trains to the experiment\nfor uid in sorting_true.get_unit_ids():\n    spike_train = sorting_true.get_unit_spike_train(unit_id=uid)\n    timestamps = spike_train.astype(np.float32) / recording.get_sampling_frequency()\n    spike_train_timeseries = experitime.Timeseries.from_numpy(\n        channel_names=['spiketrain'],\n        timestamps=timestamps,\n        values=np.ones((len(timestamps), 1),\n        dtype=np.int16),\n        type='discrete'\n    )\n    E.add_timeseries(f'unit-{uid}', spike_train_timeseries)\n\n# Load the workspace and add the experiment\nW = experitime.load_workspace(workspace_uri)\nW.add_experiment(E)\n```\n\n## Using NWB\n\nTo import a timeseries from an NWB file (not working quite yet)\n\n```python\n# Note: this does not work quite yet\nimport experitime\nimport spikeextractors as se\n\nworkspace_uri = '{workspaceUri}'\nexperiment_name = 'nwb-example-experiment'\n\n# create a timeseries using nwb file\ntimeseries = experitime.Timeseries.from_nwb('sha1://.../file.nwb')\n\n# Define a new experiment and add the recording\nE = experitime.Experiment(experiment_name)\nE.add_timeseries('nwb-recording', timeseries)\n\n# Load the workspace and add the experiment\nW = experitime.load_workspace(workspace_uri)\nW.add_experiment(E)\n```"

export default text