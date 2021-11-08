import { Story, Meta } from '@storybook/react/types-6-0';
import CancelIcon from '@material-ui/icons/Cancel';

import DataGrid, { DataGridProps } from '../../components/grids/DataGrid';

import {
  GRAY,
  DARK_ORANGE,
  DARK_RED,
  LIGHT_ORANGE,
} from '../../definitions/colors';
import { COLUMNS, fetchGridData, ROWS } from './data';
import { useCallback, useState } from 'react';

export default {
  title: 'Grids/DataGrid',
  component: DataGrid,
} as Meta;

const Template: Story<DataGridProps> = (args) => <DataGrid {...args} />;
export const Basic = Template.bind({});
Basic.args = {
  title: 'Basic Data Grid',
  columns: COLUMNS,
  data: ROWS,
};

export const WithSorting = Template.bind({});
WithSorting.args = {
  ...Basic.args,
  title: 'Data Grid w/ Column Sorting',
  sortable: true,
};

export const WithPagination = Template.bind({});
WithPagination.args = {
  ...Basic.args,
  title: 'Data Grid w/ Record Pagination',
  pagination: {
    recordsPerPage: 2,
    controlsLocation: 'both',
  },
};

export const WithServerControlledPagination: Story<DataGridProps> = (args) => {
  const [gridData, setGridData] = useState<Array<object>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const fetchPaginatedData = useCallback(({ pageSize, pageIndex }) => {
    setIsLoading(true);
    setTimeout(() => {
      setGridData(fetchGridData({ pageSize, pageIndex }));
      setPageCount(20 / pageSize);
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <DataGrid
      {...args}
      data={gridData}
      loading={isLoading}
      pagination={{
        recordsPerPage: 5,
        controlsLocation: 'bottom',
        serverSidePagination: {
          pageCount,
          fetchPaginatedData,
        },
      }}
    />
  );
};
WithServerControlledPagination.args = {
  title: 'Data Grid w/ Server Pagination',
  columns: COLUMNS,
};

export const StylePreset = Template.bind({});
StylePreset.args = {
  ...Basic.args,
  title: 'Data Grid w/ Style Preset',
  stylePreset: 'mesa',
  pagination: {
    recordsPerPage: 2,
    controlsLocation: 'bottom',
  },
};

export const CustomStyling = Template.bind({});
CustomStyling.args = {
  ...Basic.args,
  title: 'Data Grid w/ Custom Styling',
  styleOverrides: {
    headerCells: {
      borderColor: GRAY[400],
      borderWidth: 2,
      borderStyle: 'solid',
      color: GRAY[100],
      fontSize: 16,
      backgroundColor: GRAY[400],
    },
    dataCells: {
      borderColor: DARK_ORANGE,
      backgroundColor: LIGHT_ORANGE,
      color: 'whitesmoke',
    },
    icons: {
      activeColor: 'white',
      inactiveColor: GRAY[300],
    },
  },
};

export const HeaderAddOns = Template.bind({});
HeaderAddOns.args = {
  ...Basic.args,
  title: 'Data Grid w/ Custom Header Functionality',
  extraHeaderControls: [
    (column) => (
      <div onClick={() => alert('Do something supa supa evil!!!! MWA HA HA')}>
        <CancelIcon
          css={{
            color: DARK_RED,
            position: 'relative',
            left: 20,
          }}
        />
      </div>
    ),
  ],
};
