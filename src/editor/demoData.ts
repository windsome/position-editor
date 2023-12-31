import { Identifier, PositionType, RetrieveResult } from "./types";
import cloneDeep from 'lodash/cloneDeep';
import remove from 'lodash/remove';
import { v4 as uuidV4 } from 'uuid';

const sampleData: PositionType[] = [];
export async function createPosition(value: Partial<PositionType>): Promise<PositionType> {
  return new Promise(resolve => {
    setTimeout(() => {
      const _id = uuidV4();
      const createdAt = new Date();
      const updatedAt = createdAt;
      const record = {...value, _id, createdAt, updatedAt } as PositionType;
      sampleData.push(record);
      resolve(cloneDeep(record));
    }, 500);
  });
}

export async function updatePosition(_id: Identifier, value: Partial<PositionType>): Promise<PositionType> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let foundRecord: PositionType | undefined = undefined;
      for(let i = 0; i < sampleData.length; i++) {
        const record = sampleData[i];
        if (record._id === _id) {
          foundRecord = record;
          sampleData[i] = { ...record, ...value, _id };
          resolve(cloneDeep(sampleData[i]));
          return;
        }
      }
      reject(new Error(`error update! no such _id=${_id}`));
    }, 500);
  });
}

export async function removePosition(_id: Identifier): Promise<PositionType> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let old: PositionType| undefined = undefined;
      remove(sampleData, function(item){
        if (item._id == _id) {
          old = item;
          return true;
        }
        if (item.ancestor && (item.ancestor.indexOf(_id) >= 0)) return true;
        else return false;
      })
      if(old) resolve(old);
      else reject(new Error(`error remove! no such _id=${_id}`));
    }, 500);
  });
}

export async function retrievePosition(options: any): Promise<RetrieveResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const where = options?.where;
      if (Object.prototype.hasOwnProperty.call(where, 'parent')) {
        const parent = where.parent;
        const result: PositionType[] = [];
        for(let i = 0; i < sampleData.length; i++) {
          const record = sampleData[i];
          if (record.parent == parent) {
            result.push(record);
          }
        }
        resolve({total: result.length, items: cloneDeep(result)});
        return;
      }
      reject(new Error(`not support! options=${JSON.stringify(options)}`));
    }, 500);
  });
}
