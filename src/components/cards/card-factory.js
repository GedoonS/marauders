class CardFactory {
  create(config = {}) {
    throw new Error('create() must be implemented');
  }

  createMany(config = {}) {
    const { count = 1 } = config;
    const results = [];

    for (let i = 0; i < count; i++) {
      const created = this.create(config);

      if (Array.isArray(created)) {
        results.push(...created);
      } else {
        results.push(created);
      }
    }

    return results;
  }
}

export { CardFactory };
