export const findOne = async ({
  model,
  select = "",
  filter = {},
  options = {},
}) => {
  const doc = model.findOne(filter);
  if (select.length) {
    doc.select(select);
  }
  if (options?.populate) {
    doc.populate(options.populate);
  }
  if (options?.lean) {
    doc.lean();
  }
  return await doc.exec();
};

export const findById = async ({ model, id, select = "", options = {} }) => {
  const doc = model.findById(id).select(select || "");

  if (options?.populate) {
    doc = doc.populate(options.populate);
  }
  if (options?.lean) {
    doc = doc.lean();
  }
  return await doc.exec();
};

export const find = async ({
  model,
  filter = {},
  select = "",
  options = {},
}) => {
  const doc = model.find(filter).select(select || "");

  if (options?.populate) {
    doc.populate(options.populate);
  }
  if (options?.lean) {
    doc.lean();
  }
  if (options?.limit) {
    doc.limit(options.limit);
  }
  if (options?.skip) {
    doc.skip(options.skip);
  }
  return await doc.exec();
};

export const create = async ({
  model,
  data,
  options,
}) => {
  const result = await model.create(data, options);

  return Array.isArray(result) ? result[0] : result;
};

export const insertMany = async ({ model, data }) => {
  return await model.insertMany(data);
};

export const updateOne = async ({ model, filter = {}, update, options }) => {
  return await model.updateOne(filter, { ...update, $inc: { __v: 1 } });
};

export const findOneAndUpdate = async ({
  model,
  filter = {},
  update,
  options,
}) => {
  return await model.findOneAndUpdate(
    filter,
    { ...update, $inc: { __v: 1 } },
    {
      new: true,
      runValidators: true,
      ...options,
    },
  );
};

export const findByIdAndUpdate = async ({
  model,
  id = "",
  update,
  options = {
    new: true,
    runValidators: true,
  },
}) => {
  return await model.findByIdAndUpdate(
    id,
    { ...update, $inc: { __v: 1 } },
    options,
  );
};

export const deleteOne = async ({ model, filter = {} }) => {
  return await model.deleteOne(filter);
};

export const deleteMany = async ({ model, filter = {} }) => {
  return await model.deleteMany(filter);
};

export const findOneAndDelete = async ({ model, filter = {} }) => {
  return await model.findOneAndDelete(filter);
};
