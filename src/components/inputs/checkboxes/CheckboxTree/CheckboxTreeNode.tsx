import React, { useMemo } from 'react';
import { merge } from 'lodash';
import { isLeaf } from '../../SelectTree/Utils';
import IndeterminateCheckbox, { IndeterminateCheckboxProps } from '../IndeterminateCheckbox';
import { ArrowRight, ArrowDropDown } from '@material-ui/icons';
import { CSSProperties } from '@emotion/serialize';

export type CheckboxTreeNodeStyleSpec = {
  list?: {
    listStyle: CSSProperties['listStyle'],
  },
  children?: {
    padding: CSSProperties['padding']
    margin: CSSProperties['margin']
  },
  topLevelNode?: React.CSSProperties;
  leafNodeLabel?: React.CSSProperties;
  nodeLabel?: React.CSSProperties;
};

const defaultStyleSpec: CheckboxTreeNodeStyleSpec = {
  list: {
    listStyle: 'none',
  },
  children: {
    padding: '0 0 0 1.5em',
    margin: 0,
  },
  topLevelNode: {},
  leafNodeLabel: {
    display: 'flex',
    width: '100%',
    marginLeft: '1em',
  },
  nodeLabel: {
    display: 'flex',
    width: '100%',
    marginLeft: 0,
  }
}

const visibleElement = { display: '' };
const hiddenElement = { display: 'none' };

type TreeRadioProps<T> = {
  name: string;
  checked: boolean;
  value: string;
  node: T;
  onChange: (node: T, checked: boolean) => void;
}

function TreeRadio<T>({
    name,
    checked,
    value,
    node,
    onChange
}: TreeRadioProps<T>) {
    
    const handleClick = () => {
        if (!checked) {
            onChange(node, false);
        }
    };

    return (
        <input 
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={handleClick}
        />
    )
}

type NodeState = {
  isSelected: boolean;
  isVisible: boolean;
  isIndeterminate?: boolean;
  isExpanded?: boolean;
}

export type CustomCheckboxes<T> = {[index: string]: React.ComponentType<Partial<IndeterminateCheckboxProps<T>>>};

type Props<T> = {
  node: T;
  name: string;
  path: number[];
  getNodeState: (node: T) => NodeState;
  isSelectable: boolean;
  isMultiPick: boolean;
  isActiveSearch: boolean;
  toggleExpansion: (node: T) => void;
  toggleSelection: (node: T, checked: boolean) => void;
  getNodeId: (node: T) => string;
  getNodeChildren: (node: T) => T[];
  renderNode: (node: T, path?: number[]) => React.ReactNode;
  customCheckboxes?: CustomCheckboxes<T>;
  shouldExpandOnClick: boolean;
  styleOverrides?: CheckboxTreeNodeStyleSpec;
  isTopLevelNode?: boolean;
}

export default function CheckboxTreeNode<T>({
    name,
    node,
    path,
    getNodeState,
    isSelectable,
    isMultiPick,
    isActiveSearch,
    toggleSelection,
    toggleExpansion,
    getNodeId,
    getNodeChildren,
    renderNode,
    customCheckboxes,
    shouldExpandOnClick,
    styleOverrides = {},
    isTopLevelNode = false,
  }: Props<T>
) {
  const styleSpec: CheckboxTreeNodeStyleSpec = useMemo(() => {
    return merge({}, defaultStyleSpec, styleOverrides)
  }, [styleOverrides])

    let { isSelected, isIndeterminate, isVisible, isExpanded } = getNodeState(node);
    let isLeafNode = isLeaf(node, getNodeChildren);
    let nodeVisibilityCss = isVisible ? visibleElement : hiddenElement;
    let childrenVisibilityCss = isExpanded ? visibleElement : hiddenElement;
    let inputName = isLeafNode ? name : '';
    let nodeId = getNodeId(node);
    const nodeElement = renderNode(node, path);
    const commonInputProps = {
      name: inputName,
      checked: isSelected,
      node,
      value: nodeId,
    };
    const checkboxProps: IndeterminateCheckboxProps<T> = {...commonInputProps, indeterminate: !!isIndeterminate, onChange: (isChecked: boolean) => toggleSelection(node, isChecked) };
    const CustomCheckbox = (customCheckboxes && (nodeId in customCheckboxes)) ? customCheckboxes[nodeId] : undefined;

    return (
      <li css={{
          ...nodeVisibilityCss, 
          ...styleSpec.list,
      }}>
        <div 
          css={
            isTopLevelNode ? { display: 'flex', ...styleSpec.topLevelNode} : {display: 'flex'}
          }
        >
          {isLeafNode || isActiveSearch ? (
            null
          ) : (
            isExpanded ? 
              <ArrowDropDown 
                style={{color: '#aaa', lineHeight: '1em'}} 
                tabIndex={0} 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpansion(node);
                }}
                onKeyDown={(e) => e.key === 'Enter' ? toggleExpansion(node) : null} 
              /> :
              <ArrowRight 
                style={{color: '#aaa', lineHeight: '1em'}}
                tabIndex={0} 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpansion(node);
                }}
                onKeyDown={(e) => e.key === 'Enter' ? toggleExpansion(node) : null} 
              />
          )}
          {!isSelectable || (!isMultiPick && !isLeafNode) ? (
            <div
              css={{width: '100%', margin: 'auto 0'}}
              onClick={shouldExpandOnClick ? () => toggleExpansion(node) : undefined}
              >
              {nodeElement}
            </div>
          ) : (
            <label css={
              isLeafNode ? {...styleSpec.leafNodeLabel} : {...styleSpec.nodeLabel}
            }>
              {CustomCheckbox ? <CustomCheckbox {...checkboxProps} /> : isMultiPick
                  ? <IndeterminateCheckbox {...checkboxProps} />
                  : <TreeRadio
                      {...commonInputProps}
                      onChange={toggleSelection}
                    />
              } 
              <div
                css={{width: '100%', margin: 'auto 0'}}
              >
                {nodeElement}
              </div>
            </label>
          )}
        </div>
        { !isLeafNode && isVisible && isExpanded &&
          <ul css={{...childrenVisibilityCss, ...styleSpec.children}}>
            {getNodeChildren(node).map((child, index) =>
              <CheckboxTreeNode
                key={"node_" + getNodeId(child)}
                name={name}
                node={child}
                path={path.concat(index)}
                getNodeState={getNodeState}
                isSelectable={isSelectable}
                isMultiPick={isMultiPick}
                isActiveSearch={isActiveSearch}
                toggleSelection={toggleSelection}
                toggleExpansion={toggleExpansion}
                shouldExpandOnClick={shouldExpandOnClick}
                getNodeId={getNodeId}
                getNodeChildren={getNodeChildren}
                renderNode={renderNode}
                customCheckboxes={customCheckboxes} 
                styleOverrides={styleOverrides} />
            )}
          </ul>
        }
      </li>
    );
}