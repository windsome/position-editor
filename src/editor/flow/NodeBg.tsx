import * as React from 'react';
import './node-bg.css';

function NodeBg({ data }: any) {
  const { image, matrixString } = data?.bg || {};
  const style = React.useMemo(() => {
    return {
      left: 0,
      top: 0,
      transform: matrixString,
      transformOrigin: '0px 0px 0px',
    }
  }, [matrixString]);
  return (
    <img src={image} style={style} alt='无背景图片'/>
  );
}

export default NodeBg;
