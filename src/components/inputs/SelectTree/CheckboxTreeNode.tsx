import React from 'react';
import { isLeaf } from './Utils';
import IndeterminateCheckbox, { IndeterminateCheckboxProps } from './IndeterminateCheckbox';
import { ArrowRight, ArrowDropDown } from '@material-ui/icons';
import { css } from '@emotion/react';
import { CSSProperties } from '@emotion/serialize';

export type CheckboxListStyleSpec = {
  list: {
    listStyle: CSSProperties['listStyle'],
    cursor: CSSProperties['cursor'],
  },
  options: {
    textHoverEffect: CSSProperties['textDecoration']
  }
};

const optionsHoverDecoration = css({
  textDecoration: 'underline',
})

const defaultStyle = {
  list: {
    listStyle: 'none',
    cursor: 'pointer',
  },
  options: {
    '&:hover': optionsHoverDecoration,
  },
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
    shouldExpandOnClick
  }: Props<T>
) {
    // We have to apply the generic type `T` to these child components. This is
    // a known TypeScript issue and will likely be solved in the future.
    // const IndeterminateCheckboxT = IndeterminateCheckbox as new () => IndeterminateCheckbox<T>;
    // const TreeRadioT = TreeRadio as new () => TreeRadio<T>;

    let { isSelected, isIndeterminate, isVisible, isExpanded } = getNodeState(node);
    let isLeafNode = isLeaf(node, getNodeChildren);
    let nodeVisibilityCss = isVisible ? visibleElement : hiddenElement;
    let childrenVisibilityCss = isExpanded ? visibleElement : hiddenElement;
    let nodeType = isLeafNode ? "leaf"
                 : isExpanded ? "expanded"
                 : "collapsed";
    let inputName = isLeafNode ? name : '';
    let nodeId = getNodeId(node);
    const nodeElement = renderNode(node, path);
    const commonInputProps = {
      name: inputName,
      checked: isSelected,
      node,
      value: nodeId,
    };
    const checkboxProps: IndeterminateCheckboxProps<T> = {...commonInputProps, indeterminate: !!isIndeterminate, toggleCheckbox: toggleSelection};
    const CustomCheckbox = (customCheckboxes && (nodeId in customCheckboxes)) ? customCheckboxes[nodeId] : undefined;

    return (
      <li css={{
        nodeVisibilityCss, 
        ...defaultStyle.list
      }}>
        <div css={{
          display: 'flex',
          ...defaultStyle.options
        }}>
          {isLeafNode || isActiveSearch ? (
            <></>
          ) : (
            isExpanded ? <ArrowDropDown onClick={() => toggleExpansion(node)}/> :
              <ArrowRight onClick={() => toggleExpansion(node)}/>
          )}
          {!isSelectable || (!isMultiPick && !isLeafNode) ? (
            <div
              onClick={shouldExpandOnClick ? () => toggleExpansion(node) : undefined}
            >
              {nodeElement}
            </div>
          ) : (
            <label>
              {CustomCheckbox ? <CustomCheckbox {...checkboxProps} /> : isMultiPick
                  ? <IndeterminateCheckbox {...checkboxProps} />
                  : <TreeRadio
                      {...commonInputProps}
                      onChange={toggleSelection}
                    />
              } {nodeElement}
            </label>
          )}
        </div>
        { !isLeafNode && isVisible && isExpanded &&
          <ul css={{childrenVisibilityCss, padding: 0, paddingLeft: '1.5em'}}>
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
                customCheckboxes={customCheckboxes} />
            )}
          </ul>
        }
      </li>
    );
}